const express = require('express');
const https = require('https');

const app = express();
const PORT = 8004;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_SUMMARY_API_KEY = process.env.LLM_SUMMARY_API_KEY;
const MODEL = 'gpt-4o-mini';

app.use(express.json({ limit: '1mb' }));

// CORS for n8n cloud
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Strip HTML tags
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

// Check if update should be skipped
function shouldSkip(body) {
  const lower = body.toLowerCase();
  const skipPatterns = [
    'parts check',
    '***',
    'automated',
    'client form response summary',
    'form response summary'
  ];
  return skipPatterns.some(p => lower.includes(p));
}

// Format updates for the prompt
function formatUpdates(updates) {
  return updates
    .filter(u => u.body && !shouldSkip(stripHtml(u.body)))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(u => {
      const text = stripHtml(u.body);
      const date = new Date(u.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const creator = u.creator?.name || 'Unknown';
      return `[${date} - ${creator}]: ${text}`;
    });
}

// Build the prompt
function buildPrompt(formattedUpdates, context, type) {
  const typeLabel = type === 'collection' ? 'collection' : 'drop-off';
  const contextLine = context
    ? `Client: ${context.clientName || 'Unknown'}, Device: ${context.deviceType || 'Unknown'}, Service: ${context.service || 'Unknown'}, Status: ${context.status || 'Unknown'}`
    : '';

  return `You are categorizing repair workshop notes for a customer ${typeLabel}. ${contextLine}

Below are chronological updates from our repair system. Each has a date and the name of the person who wrote it (CS agents handle intake, techs do repairs).

Categorize into exactly 3 sections. Use concise bullet points. If a section has no relevant info, write "N/A".

1. **What the client told us**: Issues the customer reported, symptoms described, requests made. Pre-repair information from CS agents or customer forms.
2. **What we found**: Diagnostic results, intake observations, additional issues discovered by technicians during repair.
3. **What we did**: Repair actions completed, parts replaced, tests performed, final outcomes.

Updates:
${formattedUpdates.join('\n\n')}

Respond in this exact JSON format only (no markdown, no code blocks, no explanation):
{"clientSaid":"...","whatWeFound":"...","whatWeDid":"..."}`;
}

// Call OpenAI API
function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.1
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`${res.statusCode} ${data.substring(0, 200)}`));
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content.trim());
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

app.post('/api/summarize-updates', async (req, res) => {
  const start = Date.now();

  // API key check
  const authKey = req.headers['x-api-key'];
  if (LLM_SUMMARY_API_KEY && authKey !== LLM_SUMMARY_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  const { updates, context, type } = req.body;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ error: 'Missing or invalid updates array' });
  }

  const formattedUpdates = formatUpdates(updates);

  if (formattedUpdates.length === 0) {
    console.log(`${new Date().toISOString()} | ${type || 'unknown'} | no-updates`);
    return res.json({
      summary: { clientSaid: 'N/A', whatWeFound: 'N/A', whatWeDid: 'N/A' },
      fallback: false
    });
  }

  try {
    const prompt = buildPrompt(formattedUpdates, context, type || 'collection');
    const text = await callOpenAI(prompt);

    // Parse JSON from response (handle possible markdown wrapping)
    let parsed;
    try {
      const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error(`${new Date().toISOString()} | ${type || 'unknown'} | parse-error | ${text.substring(0, 100)}`);
      return res.json({
        summary: { clientSaid: '', whatWeFound: '', whatWeDid: '' },
        fallback: true
      });
    }

    console.log(`${new Date().toISOString()} | ${type || 'unknown'} | success | ${Date.now() - start}ms`);
    return res.json({
      summary: {
        clientSaid: parsed.clientSaid || 'N/A',
        whatWeFound: parsed.whatWeFound || 'N/A',
        whatWeDid: parsed.whatWeDid || 'N/A'
      },
      fallback: false
    });

  } catch (err) {
    console.error(`${new Date().toISOString()} | ${type || 'unknown'} | error | ${err.message}`);
    return res.json({
      summary: { clientSaid: '', whatWeFound: '', whatWeDid: '' },
      fallback: true
    });
  }
});

// Health check
app.get('/api/summarize-updates/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), model: MODEL });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`LLM Summary endpoint listening on port ${PORT} (model: ${MODEL})`);
});
