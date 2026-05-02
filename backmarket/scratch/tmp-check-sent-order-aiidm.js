require('/home/ricky/builds/backmarket/node_modules/dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fetch = global.fetch;

const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const DEVICE_LOOKUP_BOARD = 3923707691;
const DEVICE_LOOKUP_GROUP = 'new_group';
const BM_TO_DEVICE_MAP = {
  'MacBook Air 13 (Late 2020)': 'MacBook Air 13 M1 A2337',
  'MacBook Air 13 (Mid 2022)': 'MacBook Air 13 M2 A2681',
  'MacBook Air 13 (Mid 2024)': 'MacBook Air 13 M3 A3113',
  'MacBook Air 13 (Mid 2020)': 'MacBook Air 13 A2179',
  'MacBook Air 13 (Mid 2018)': 'MacBook Air 13 A1932',
  'MacBook Air 15 (Mid 2023)': 'MacBook Air 15 M2 A2941',
  'MacBook Air 15 (Mid 2024)': 'MacBook Air 15 M3 A3114',
  'MacBook Pro 13 (Late 2020)': 'MacBook Pro 13 M1 A2338',
  'MacBook Pro 13 (Mid 2022)': 'MacBook Pro 13 M2 A2338',
  'MacBook Pro 13 (Mid 2020)': 'MacBook Pro 13 2TB 3 A2289',
  'MacBook Pro 13 (Mid 2019)': 'MacBook Pro 13 2TB 3 A2159',
  'MacBook Pro 13 Touch Bar (Mid 2019)': 'MacBook Pro 13 Touch Bar A1989',
  'MacBook Pro 13 Touch Bar (Mid 2018)': 'MacBook Pro 13 Touch Bar A1706',
  'MacBook Pro 13 4TB (Mid 2020)': 'MacBook Pro 13 4TB 3 A2251',
  'MacBook Pro 14 (Late 2021)': 'MacBook Pro 14 M1 Pro/Max A2442',
  'MacBook Pro 14 (Early 2023)': 'MacBook Pro 14 M2 Pro/Max A2779',
  'MacBook Pro 14 (Late 2023)': 'MacBook Pro 14 M3 A2918',
  'MacBook Pro 14 (Mid 2024)': 'MacBook Pro 14 M3 A2992',
  'MacBook Pro 14 (Late 2024)': 'MacBook Pro 14 M4 A3401',
  'MacBook Pro 14 (Nov 2024)': 'MacBook Pro 14 M4 A3112',
  'MacBook Pro 15 (Mid 2019)': 'MacBook Pro 15 A1990',
  'MacBook Pro 15 (Mid 2018)': 'MacBook Pro 15 A1707',
  'MacBook Pro 16 (Late 2019)': 'MacBook Pro 16 A2141',
  'MacBook Pro 16 (Late 2021)': 'MacBook Pro 16 M1 Pro/Max A2485',
  'MacBook Pro 16 (Early 2023)': 'MacBook Pro 16 M2 Pro/Max A2780',
  'MacBook Pro 16 (Late 2023)': 'MacBook Pro 16 M3 Pro/Max A2991',
  'MacBook 12 (Mid 2019)': 'MacBook 12 A1534',
};

async function bmApi(path) {
  const r = await fetch(path.startsWith('http') ? path : `${BM_BASE}${path}`, {
    headers: {
      Authorization: BM_AUTH,
      'Accept-Language': BM_LANG,
      'User-Agent': BM_UA,
      'Content-Type': 'application/json',
    },
  });
  if (!r.ok) throw new Error(`BM ${r.status}: ${await r.text()}`);
  return r.json();
}

async function mondayApi(query) {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

function extractBMModel(deviceTitle) {
  if (!deviceTitle) return null;
  const match = deviceTitle.match(/(MacBook (?:Air|Pro)) (\d+)"?\s*\(([^)]+)\)/i);
  if (match) return `${match[1]} ${match[2]} (${match[3]})`;
  return null;
}

async function findDeviceItemByName(deviceName) {
  if (!deviceName) return null;
  const q = `{ boards(ids:[${DEVICE_LOOKUP_BOARD}]) { groups(ids:["${DEVICE_LOOKUP_GROUP}"]) { items_page(limit: 500) { items { id name } } } } }`;
  const d = await mondayApi(q);
  const items = d.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  return items.find(item => item.name === deviceName) || null;
}

(async () => {
  const orderId = 'GB-26173-AIIDM';
  const mainItemId = 11837158700;
  const order = await bmApi(`/ws/buyback/v1/orders/${orderId}`);
  const deviceTitle = order.listing?.title || '';
  const bmModel = extractBMModel(deviceTitle);
  const mappedDeviceName = bmModel ? BM_TO_DEVICE_MAP[bmModel] : null;
  const matchedDevice = mappedDeviceName ? await findDeviceItemByName(mappedDeviceName) : null;
  const mainItem = await mondayApi(`{ items(ids:[${mainItemId}]) { id name column_values(ids:["text_mky01vb4","board_relation5"]) { id text value } } }`);
  console.log(JSON.stringify({
    orderId,
    deviceTitle,
    bmModel,
    mappedDeviceName,
    matchedDevice,
    wouldWriteBoardRelation5: matchedDevice?.id ? { item_ids: [parseInt(matchedDevice.id, 10)] } : null,
    mondayMainItem: mainItem.data?.items?.[0] || null
  }, null, 2));
})();
