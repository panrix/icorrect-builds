const LIVE_SAFE_TRUST_CLASSES = new Set([
  'registry_verified',
  'probe_verified',
  'vetted_exact_with_no_current_contradiction',
]);

const GRADE_ALIASES = {
  FAIR: 'FAIR',
  GOOD: 'GOOD',
  VERYGOOD: 'VERY_GOOD',
  VERY_GOOD: 'VERY_GOOD',
  EXCELLENT: 'VERY_GOOD',
};

const COLOUR_ALIASES = {
  SPACEGREY: 'GREY',
  SPACEGRAY: 'GREY',
  GREY: 'GREY',
  GRAY: 'GREY',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  MIDNIGHT: 'MIDNIGHT',
  STARLIGHT: 'STARLIGHT',
  BLACK: 'BLACK',
  SPACEBLACK: 'SPACEBLACK',
  ROSEGOLD: 'ROSEGOLD',
  BLUE: 'BLUE',
  WHITE: 'WHITE',
  GREEN: 'GREEN',
  RED: 'RED',
  PINK: 'PINK',
  PURPLE: 'PURPLE',
  CHAMPAGNE: 'CHAMPAGNE',
};

function normalizeResolverGrade(value) {
  const token = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  return GRADE_ALIASES[token] || token;
}

function normalizeResolverColour(value) {
  const token = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '');
  return COLOUR_ALIASES[token] || token;
}

function normalizeResolverRam(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeResolverSsd(value) {
  const token = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  if (token === '1000GB') return '1TB';
  if (token === '2000GB') return '2TB';
  if (token === '4000GB') return '4TB';
  return token;
}

function normalizeResolverSkuToken(token) {
  const compact = String(token || '').trim().toUpperCase().replace(/[\s"']/g, '');
  if (!compact) return '';
  if (GRADE_ALIASES[compact]) return GRADE_ALIASES[compact];
  if (COLOUR_ALIASES[compact]) return COLOUR_ALIASES[compact];
  return compact;
}

function normalizeResolverSku(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const compact = raw
    .toUpperCase()
    .replace(/[\s"']/g, '')
    .replace(/-/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
  const parts = compact.split('.').filter(Boolean).map(normalizeResolverSkuToken);
  return parts.join('.');
}

function isMacBookFamily(modelFamily = '') {
  return /^MacBook (Air|Pro)\b/i.test(String(modelFamily || '').trim());
}

function isResolverSlotLiveSafe(slot) {
  return !!slot?.verified && LIVE_SAFE_TRUST_CLASSES.has(slot?.trust_class);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickPreferredSlot(existingSlot, candidateSlot) {
  const existingSafe = isResolverSlotLiveSafe(existingSlot);
  const candidateSafe = isResolverSlotLiveSafe(candidateSlot);
  if (existingSafe !== candidateSafe) return candidateSafe ? candidateSlot : existingSlot;

  const existingVerified = !!existingSlot?.verified;
  const candidateVerified = !!candidateSlot?.verified;
  if (existingVerified !== candidateVerified) return candidateVerified ? candidateSlot : existingSlot;

  const existingTime = Date.parse(existingSlot?.last_verified_at || existingSlot?.created_at || '') || 0;
  const candidateTime = Date.parse(candidateSlot?.last_verified_at || candidateSlot?.created_at || '') || 0;
  if (existingTime !== candidateTime) return candidateTime > existingTime ? candidateSlot : existingSlot;

  const existingListingId = existingSlot?.listing_id ? 1 : 0;
  const candidateListingId = candidateSlot?.listing_id ? 1 : 0;
  if (existingListingId !== candidateListingId) return candidateListingId ? candidateSlot : existingSlot;

  return existingSlot;
}

function upgradeRegistrySlot(slot, fallbackKey, defaultSource = 'build-listings-registry') {
  const normalizedSku = normalizeResolverSku(slot?.sku || fallbackKey);
  const normalizedGrade = normalizeResolverGrade(slot?.grade || normalizedSku.split('.').pop() || '');
  const createdAt = slot?.created_at || slot?.last_verified_at || null;
  const verified = slot?.verified !== false;

  return {
    ...slot,
    requested_product_id: slot?.requested_product_id || slot?.product_id || '',
    sku: normalizedSku,
    grade: normalizedGrade || slot?.grade || '',
    ram: normalizeResolverRam(slot?.ram || ''),
    ssd: normalizeResolverSsd(slot?.ssd || ''),
    trust_class: slot?.trust_class || (verified ? 'registry_verified' : 'needs_probe'),
    source: slot?.source || defaultSource,
    verified,
    created_at: createdAt,
    last_verified_at: slot?.last_verified_at || createdAt,
    contradiction_flags: ensureArray(slot?.contradiction_flags),
    issues: ensureArray(slot?.issues),
  };
}

function upgradeRegistrySchema(registry, options = {}) {
  const source = options.defaultSource || 'build-listings-registry';
  const slots = registry?.slots || {};
  const normalizedSlots = {};
  const stats = {
    total_slots: 0,
    normalized_keys: 0,
    backfilled_trust_class: 0,
    backfilled_source: 0,
    backfilled_last_verified_at: 0,
    backfilled_contradiction_flags: 0,
    deduped_collisions: 0,
  };

  for (const [key, originalSlot] of Object.entries(slots)) {
    const upgradedSlot = upgradeRegistrySlot(originalSlot, key, source);
    const normalizedKey = upgradedSlot.sku || normalizeResolverSku(key);
    stats.total_slots += 1;
    if (normalizedKey && normalizedKey !== key) stats.normalized_keys += 1;
    if (!originalSlot?.trust_class && upgradedSlot.trust_class) stats.backfilled_trust_class += 1;
    if (!originalSlot?.source && upgradedSlot.source) stats.backfilled_source += 1;
    if (!originalSlot?.last_verified_at && upgradedSlot.last_verified_at) stats.backfilled_last_verified_at += 1;
    if (!Array.isArray(originalSlot?.contradiction_flags)) stats.backfilled_contradiction_flags += 1;

    const existing = normalizedSlots[normalizedKey];
    if (!existing) {
      normalizedSlots[normalizedKey] = upgradedSlot;
      continue;
    }

    stats.deduped_collisions += 1;
    const preferred = pickPreferredSlot(existing, upgradedSlot);
    const rejected = preferred === existing ? upgradedSlot : existing;
    preferred.contradiction_flags = Array.from(new Set([
      ...ensureArray(preferred.contradiction_flags),
      ...ensureArray(rejected.contradiction_flags),
      'duplicate_registry_key_conflict',
    ]));
    normalizedSlots[normalizedKey] = preferred;
  }

  const upgradedRegistry = {
    ...registry,
    canonical_store: 'listings-registry',
    resolver_schema_version: 1,
    slots: normalizedSlots,
    blocked_slots: ensureArray(registry?.blocked_slots),
    failed_slots: ensureArray(registry?.failed_slots),
  };

  upgradedRegistry.verified = Object.values(normalizedSlots).filter(slot => slot.verified).length;
  upgradedRegistry.blocked = upgradedRegistry.blocked_slots.length;
  upgradedRegistry.failed = upgradedRegistry.failed_slots.length;
  upgradedRegistry.total_slots = Object.keys(normalizedSlots).length;
  upgradedRegistry.total_processed = upgradedRegistry.total_slots + upgradedRegistry.blocked + upgradedRegistry.failed;

  return { registry: upgradedRegistry, stats };
}

function findResolverSlot(registry, identifiers = {}) {
  const slots = registry?.slots || {};
  const normalizedSku = normalizeResolverSku(identifiers.sku);
  if (normalizedSku && slots[normalizedSku]) return slots[normalizedSku];

  const listingId = identifiers.listingId !== undefined && identifiers.listingId !== null
    ? String(identifiers.listingId)
    : '';
  if (listingId) {
    for (const slot of Object.values(slots)) {
      if (String(slot?.listing_id || '') === listingId) return slot;
    }
  }

  const productId = String(identifiers.productId || '').trim();
  const grade = normalizeResolverGrade(identifiers.grade);
  if (!productId) return null;

  const productMatches = Object.values(slots).filter(slot => String(slot?.product_id || '').trim() === productId);
  if (grade) {
    const exact = productMatches.find(slot => normalizeResolverGrade(slot?.grade) === grade);
    if (exact) return exact;
  }
  return productMatches.length === 1 ? productMatches[0] : null;
}

module.exports = {
  LIVE_SAFE_TRUST_CLASSES,
  findResolverSlot,
  isMacBookFamily,
  isResolverSlotLiveSafe,
  normalizeResolverColour,
  normalizeResolverGrade,
  normalizeResolverRam,
  normalizeResolverSku,
  normalizeResolverSsd,
  upgradeRegistrySchema,
  upgradeRegistrySlot,
};
