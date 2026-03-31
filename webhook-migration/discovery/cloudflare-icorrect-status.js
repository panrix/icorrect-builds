--5babcbcf86c140a23153f5b1fdf3ffd45ff3c9018d1d63aec775c90f299c
Content-Disposition: form-data; name="worker.js"

/**
 * Cloudflare Worker: Main Board Status Router
 * Board: 349212843 (iCorrect Main Board)
 * Column: status4 (Status)
 * 
 * Routes specific status changes to appropriate n8n workflows
 * Worker Name: icorrect-status (or similar)
 */

const N8N_WEBHOOK_PARTS_DEDUCTION = 'https://icorrect.app.n8n.cloud/webhook/parts-deduction';

// Status values that trigger parts deduction
const PARTS_DEDUCTION_TRIGGERS = ['Ready To Collect'];

// Add future triggers here:
// const SOME_OTHER_TRIGGERS = ['Returned', 'Shipped'];

export default {
  async fetch(request, env, ctx) {
    // Handle Monday.com webhook challenge (for initial setup)
    if (request.method === 'POST') {
      const body = await request.json();
      
      // Monday.com sends a challenge when setting up the webhook
      if (body.challenge) {
        return new Response(JSON.stringify({ challenge: body.challenge }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Extract event data
      const event = body.event;
      
      if (!event) {
        return new Response('No event data', { status: 400 });
      }

      // Log for debugging (visible in Cloudflare dashboard)
      console.log('Received event:', JSON.stringify(event));

      // Get the new status value
      const newValue = event.value?.label?.text || event.value?.label || null;
      const itemId = event.pulseId || event.itemId;
      const boardId = event.boardId;

      console.log(`Status changed to: "${newValue}" for item ${itemId}`);

      // Route based on new status value
      if (PARTS_DEDUCTION_TRIGGERS.includes(newValue)) {
        console.log('Triggering parts deduction workflow');
        
        // Forward to n8n
        const n8nPayload = {
          trigger: 'status_ready_to_collect',
          itemId: itemId,
          boardId: boardId,
          newStatus: newValue,
          timestamp: new Date().toISOString(),
          rawEvent: event
        };

        try {
          const n8nResponse = await fetch(N8N_WEBHOOK_PARTS_DEDUCTION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload)
          });

          console.log('n8n response status:', n8nResponse.status);
          
          return new Response(JSON.stringify({ 
            success: true, 
            routed_to: 'parts-deduction',
            n8n_status: n8nResponse.status 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error calling n8n:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Add future routing here:
      // if (SOME_OTHER_TRIGGERS.includes(newValue)) { ... }

      // Status not in our trigger list - acknowledge but don't route
      return new Response(JSON.stringify({ 
        success: true, 
        action: 'ignored',
        reason: `Status "${newValue}" not in trigger list`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle GET requests (health check)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        worker: 'status-router',
        board: 349212843,
        column: 'status4',
        triggers: {
          parts_deduction: PARTS_DEDUCTION_TRIGGERS
        },
        status: 'healthy'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
--5babcbcf86c140a23153f5b1fdf3ffd45ff3c9018d1d63aec775c90f299c--
