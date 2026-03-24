/**
 * colour-map.js — Apple colour names → BackMarket SKU colour slugs
 * Used by listing automation to match device colour to BM listing SKU.
 * If a colour is not in this map, listing is BLOCKED and Slack alert sent.
 */

const COLOUR_MAP = {
  'Silver': 'silver',
  'Space Grey': 'space-grey',
  'Space Gray': 'space-grey',
  'Space Black': 'space-black',
  'Starlight': 'starlight',
  'Midnight': 'midnight',
  'Gold': 'gold',
  'Rose Gold': 'rose-gold',
  'Champagne': 'starlight',
};

/**
 * Map an Apple colour string to a BM SKU colour slug.
 * @param {string} appleColour - Colour label from Monday (e.g. "Space Grey")
 * @returns {{ slug: string }|null} - BM colour slug or null if unmapped
 */
function mapColour(appleColour) {
  if (!appleColour) return null;
  const slug = COLOUR_MAP[appleColour.trim()];
  return slug ? { slug } : null;
}

module.exports = { COLOUR_MAP, mapColour };
