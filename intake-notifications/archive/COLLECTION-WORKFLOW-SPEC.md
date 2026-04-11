# Collection Workflow Specification

## Overview
**Workflow ID:** FB83t0dN0PNlEOpd (created, needs completion)
**Typeform:** vslvbFQr (Collection Form)
**Slack Channel:** collection-form-responses (C09G72DRZC7)
**Purpose:** Enrich collection form submissions with Monday data and post to Slack

## Workflow Flow

```
Typeform Trigger → Extract Form Data → Has Monday ID? 
   ↓ (Yes)                     ↓ (No)
Fetch by ID               Search by Email
   ↓                           ↓
Process Monday Results ← ← ← ← ← ←
   ↓
Multiple Matches? → (Yes) → Slack Alert (ends)
   ↓ (No)
Fetch Monday Updates
   ↓
Check Repeat Customer
   ↓
Enrichment Analysis
   ↓
Slack Enriched Notification
```

## Node Details

### 1. Typeform Trigger
- **Type:** Typeform Trigger
- **Form ID:** vslvbFQr
- **Credential:** Typeform account (bqyPkUAjnFJ8SrHN)

### 2. Extract Form Data (Code Node)
```javascript
// Extract data from Typeform collection form
const tf = $input.first().json;

// Extract form fields
const name = (tf['name'] || tf['Name'] || 'Customer').trim();
const deviceType = tf['device_type'] || tf['Device Type'] || '';

// Hidden fields for Monday lookup
const mondayId = tf['monday_id'] || tf['Monday ID'] || '';
const email = (tf['email'] || tf['Email'] || '').trim().toLowerCase();

// Validation
if (!mondayId && !email) {
  throw new Error(
    'No Monday ID or email for lookup. Available fields: ' +
    JSON.stringify(Object.keys(tf), null, 2)
  );
}

return {
  json: {
    name,
    deviceType,
    mondayId,
    email,
    _rawFields: Object.keys(tf)
  }
};
```

### 3. Has Monday ID? (IF Node)
- **Condition:** `{{ $json.mondayId }}` is not empty
- **True path:** Fetch Monday Item by ID
- **False path:** Search Monday by Email

### 4. Fetch Monday Item by ID (HTTP Request)
- **Method:** POST
- **URL:** https://api.monday.com/v2
- **Auth:** mondayComApi credential
- **Body:**
```javascript
const d = $json;
const query = `query {
  items (ids: [${d.mondayId}]) {
    id
    name
    group { id title }
    board { id }
    column_values { id text value }
  }
}`;
return JSON.stringify({ query });
```

### 5. Search Monday by Email (HTTP Request)
- **Method:** POST
- **URL:** https://api.monday.com/v2
- **Auth:** mondayComApi credential
- **Body:**
```javascript
const query = `query {
  boards (ids: [349212843]) {
    items {
      id
      name
      group { id title }
      column_values { id text value }
    }
  }
}`;
return JSON.stringify({ query });
```

### 6. Process Monday Results (Code Node)
```javascript
// Process Monday search results and find matching item(s)
const searchResponse = $input.first().json;
const formData = $('Extract Form Data').first().json;

let mondayItem = null;
let multipleMatches = [];

// Check if this came from direct ID lookup or email search
const isDirectLookup = $node.name === 'Fetch Monday Item by ID';

if (isDirectLookup) {
  // Direct ID lookup
  const items = searchResponse.data?.items || [];
  if (items.length > 0) {
    mondayItem = items[0];
  }
} else {
  // Email search - filter by email in column
  const allItems = searchResponse.data?.boards?.[0]?.items || [];
  
  const matchingItems = allItems.filter(item => {
    const emailColumn = item.column_values?.find(col => col.id === 'text5');
    return emailColumn?.text?.toLowerCase() === formData.email;
  });
  
  // Filter to active items (especially "Awaiting Collection" group new_group34086)
  const activeItems = matchingItems.filter(item => {
    const groupId = item.group?.id;
    // Prioritize items in Awaiting Collection group
    return groupId === 'new_group34086' || !['completed_group', 'archived_group'].includes(groupId);
  });
  
  if (activeItems.length === 1) {
    mondayItem = activeItems[0];
  } else if (activeItems.length > 1) {
    multipleMatches = activeItems;
  }
}

if (!mondayItem && multipleMatches.length === 0) {
  throw new Error(`No Monday item found for ${formData.mondayId ? 'ID: ' + formData.mondayId : 'email: ' + formData.email}`);
}

return {
  json: {
    ...formData,
    mondayItem,
    multipleMatches,
    hasMultipleMatches: multipleMatches.length > 0
  }
};
```

### 7. Multiple Matches? (IF Node)
- **Condition:** `{{ $json.hasMultipleMatches }}` is true
- **True path:** Slack Multiple Matches Alert (terminal)
- **False path:** Fetch Monday Updates

### 8. Slack Multiple Matches Alert (Slack Node)
- **Channel:** C09G72DRZC7 (collection-form-responses)
- **Message:**
```
⚠️ *Multiple Monday Items Found for Collection*

*Customer:* {{ $json.name }}
*Email:* {{ $json.email }}
*Device:* {{ $json.deviceType }}

*Matching Items:*
{{ $json.multipleMatches.map(item => `• ${item.name} (${item.group?.title || 'Unknown Group'})`).join('\n') }}

@channel Please identify the correct item for this collection.
```

### 9. Fetch Monday Updates (HTTP Request)
- **Method:** POST
- **URL:** https://api.monday.com/v2
- **Auth:** mondayComApi credential
- **Body:**
```javascript
const d = $json;
const query = `query {
  items (ids: [${d.mondayItem.id}]) {
    updates (limit: 15) {
      id
      body
      created_at
      creator { name }
    }
  }
}`;
return JSON.stringify({ query });
```

### 10. Check Repeat Customer (HTTP Request)
- **Method:** POST
- **URL:** https://api.monday.com/v2
- **Auth:** mondayComApi credential
- **Body:** Same as "Search Monday by Email" (gets all board items for comparison)

### 11. Enrichment Analysis (Code Node)
```javascript
// ENRICHMENT ANALYSIS
// Analyze Monday item data, updates, and customer history

const formData = $('Process Monday Results').first().json;
const updatesResponse = $('Fetch Monday Updates').first().json;
const repeatCustomerResponse = $('Check Repeat Customer').first().json;

const mondayItem = formData.mondayItem;
const updates = updatesResponse.data?.items?.[0]?.updates || [];
const allItems = repeatCustomerResponse.data?.boards?.[0]?.items || [];

// Extract column data
const getColumnValue = (columnId) => {
  const col = mondayItem.column_values?.find(c => c.id === columnId);
  return col?.text || col?.value || '';
};

const email = getColumnValue('text5');
const phone = getColumnValue('text00');
const service = getColumnValue('service');
const status = getColumnValue('status4');
const paidAmount = getColumnValue('dup__of_quote_total');
const intercomLink = getColumnValue('link1');
const intercomId = getColumnValue('text_mm087h9p');
const problemRepair = getColumnValue('color_mkse6rw0');
const problemClient = getColumnValue('color_mkse6bhk');
const caseStatus = getColumnValue('status_14');

// Payment analysis from item title
let paymentStatus = 'Unknown';
const title = mondayItem.name || '';
const paymentMatch = title.match(/\*Paying £(\d+(?:\.\d{2})?) on collection/i);
if (paidAmount && paidAmount !== '0' && paidAmount !== '') {
  paymentStatus = 'Paid in full';
} else if (paymentMatch) {
  paymentStatus = `Outstanding: "Paying £${paymentMatch[1]} on collection"`;
}

// Analyze updates for flags
const allUpdateText = updates.map(u => u.body?.toLowerCase() || '').join(' ');

const difficultyKeywords = ['difficult', 'issue', 'problem', 'complication', 'damage', 'failed'];
const chasingKeywords = ['chased', 'chasing', 'upset', 'complaint', 'unhappy', 'frustrated', 'escalat'];
const hasRepairDifficulties = difficultyKeywords.some(keyword => allUpdateText.includes(keyword));
const hasCustomerChasing = chasingKeywords.some(keyword => allUpdateText.includes(keyword));

// Escalation flags
const hasEscalation = problemRepair || problemClient;

// Repeat customer check
const customerItems = allItems.filter(item => {
  const itemEmail = item.column_values?.find(c => c.id === 'text5')?.text?.toLowerCase();
  return itemEmail === email && item.id !== mondayItem.id;
});

const isRepeatCustomer = customerItems.length > 0;
const repeatSummary = isRepeatCustomer 
  ? `Yes - ${customerItems.length} previous repair${customerItems.length === 1 ? '' : 's'}`
  : 'No';

// Recent meaningful updates (last 2-3, filter out automated ones)
const meaningfulUpdates = updates
  .filter(u => {
    const body = u.body?.toLowerCase() || '';
    return !body.includes('parts check') && 
           !body.includes('automated') && 
           body.length > 10;
  })
  .slice(0, 3)
  .map(u => {
    const cleanBody = u.body?.replace(/<[^>]*>/g, '') || '';
    const truncated = cleanBody.length > 100 ? cleanBody.substring(0, 100) + '...' : cleanBody;
    return `• ${truncated}`;
  });

// Build flags array
const flags = [];
if (hasRepairDifficulties) flags.push('⚠️ Repair difficulties detected');
if (hasCustomerChasing) flags.push('😤 Customer upset/chasing detected');
if (hasEscalation) flags.push('🚨 Escalation flag (Problem columns set)');

// Build Monday URL
const mondayUrl = `https://icorrect.monday.com/boards/349212843/pulses/${mondayItem.id}`;

// Build Intercom URL
let intercomUrl = '';
if (intercomLink) {
  try {
    const linkData = JSON.parse(intercomLink);
    intercomUrl = linkData.url || '';
  } catch {
    intercomUrl = intercomLink;
  }
} else if (intercomId) {
  intercomUrl = `https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/${intercomId}`;
}

return {
  json: {
    // Original form data
    ...formData,
    
    // Monday item data
    service,
    status,
    paymentStatus,
    mondayUrl,
    intercomUrl,
    
    // Enrichment flags
    flags,
    isRepeatCustomer,
    repeatSummary,
    meaningfulUpdates,
    caseStatus,
    accessoryNotes: caseStatus || 'No case status set'
  }
};
```

### 12. Slack Enriched Notification (Slack Node)
- **Channel:** C09G72DRZC7 (collection-form-responses)
- **Message:**
```
📦 *Collection: {{ $json.name }}*

*Device:* {{ $json.deviceType }}
*Repair:* {{ $json.service || 'Not specified' }}
*Status:* {{ $json.status || 'Unknown' }}

💰 *Payment:* {{ $json.paymentStatus }}
{{ $json.flags.length > 0 ? '⚠️ *Flags:*\n' + $json.flags.join('\n') + '\n' : '' }}
🔄 *Repeat Customer:* {{ $json.repeatSummary }}
{{ $json.meaningfulUpdates.length > 0 ? '📝 *Recent Updates:*\n' + $json.meaningfulUpdates.slice(0, 2).join('\n') + '\n' : '' }}
🎒 *Case/Accessories:* {{ $json.accessoryNotes }}

*Monday:* {{ $json.mondayUrl }}{{ $json.intercomUrl ? ' | *Intercom:* ' + $json.intercomUrl : '' }}
```

## Key Monday Columns Referenced
- `text5` - Email
- `text00` - Phone Number
- `service` - Service type status
- `status4` - Status
- `dup__of_quote_total` - Paid amount
- `link1` - Intercom Ticket link
- `text_mm087h9p` - Intercom conversation ID
- `color_mkse6rw0` - Problem (Repair) status
- `color_mkse6bhk` - Problem (Client) status
- `status_14` - Case/Accessories status (authoritative source)

## Important Notes
1. **Awaiting Collection Group:** new_group34086 - prioritize items in this group for collections
2. **Payment Detection:** Look for "*Paying £X on collection" pattern in item title
3. **Keyword Analysis:** Scan updates for repair difficulties, customer chasing
4. **Repeat Customer:** Search all board items by email to find previous repairs
5. **Escalation Flags:** Check Problem columns for escalation indicators
6. **Case/Accessories:** Use Monday column `status_14` (Case) as authoritative source - don't scan updates

## Next Steps
1. Complete the workflow in n8n UI using the above specification
2. Test with a sample collection form submission
3. Verify Slack notifications are properly formatted
4. Activate the workflow for production use

## Testing Checklist
- [ ] Typeform trigger responds to form submissions
- [ ] Monday ID lookup works correctly
- [ ] Email search finds correct items
- [ ] Multiple matches are handled properly
- [ ] Enrichment analysis extracts all data correctly
- [ ] Slack message formatting is clean and readable
- [ ] All URLs are properly formatted and clickable