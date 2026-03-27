/**
 * BackMarket API helper
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const BM_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Language': 'en-gb',
  Authorization:
    process.env.BM_AUTH ||
    process.env.BM_AUTH,
  'User-Agent': process.env.BM_UA || 'BM-iCorrect-n8n;ricky@icorrect.co.uk',
};

const BM_BUYBACK_BASE = 'https://www.backmarket.co.uk/ws/buyback/v1/orders';
const BM_LISTINGS_BASE = 'https://www.backmarket.co.uk/ws/listings';

/**
 * Fetch all buyback orders in a given state, handling pagination.
 */
async function fetchBuybackOrders(state = 'sent') {
  const orders = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `${BM_BUYBACK_BASE}?state=${state}&offset=${offset}&limit=${limit}`;
    const resp = await fetch(url, { headers: BM_API_HEADERS });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`BM buyback API ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const results = data.results || data.orders || (Array.isArray(data) ? data : []);

    if (results.length === 0) break;
    orders.push(...results);

    // If we got fewer than limit, we've reached the end
    if (results.length < limit) break;
    offset += limit;
  }

  return orders;
}

/**
 * Fetch all active listings, handling pagination.
 */
async function fetchAllListings() {
  const listings = [];
  let page = 1;

  while (true) {
    const url = `${BM_LISTINGS_BASE}?page=${page}&page_size=100`;
    const resp = await fetch(url, { headers: BM_API_HEADERS });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`BM listings API ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const results = data.results || (Array.isArray(data) ? data : []);

    if (results.length === 0) break;
    listings.push(...results);

    // Check if there's a next page (BM returns 10 per page regardless of page_size)
    if (!data.next) break;
    page++;
  }

  return listings;
}

module.exports = {
  BM_API_HEADERS,
  fetchBuybackOrders,
  fetchAllListings,
};
