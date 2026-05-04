const assert = require('assert');
const {
  extractBMModel,
  normalizeBMModelPeriod,
  BM_TO_DEVICE_MAP,
} = require('../../scripts/sent-orders');

assert.equal(
  extractBMModel('MacBook Pro 14" (2021-01-01T00:00:00+00:00) - Apple M1 Pro 10-core - 16 GB Memory - 512 GB - 16-core GPU - QWERTY'),
  'MacBook Pro 14 (Late 2021)'
);

assert.equal(
  extractBMModel('MacBook Air 13" (2020-01-01T00:00:00+00:00) - Apple M1 8-core - 8 GB Memory - 256 GB - 7-core GPU - QWERTY'),
  'MacBook Air 13 (Late 2020)'
);

assert.equal(
  extractBMModel('MacBook Pro 13" (2020-01-01T00:00:00+00:00) - Apple M1 - 8 GB Memory - 512 GB - 8-core GPU - QWERTY'),
  'MacBook Pro 13 (Late 2020)'
);

assert.equal(
  extractBMModel('MacBook Pro 13" (2022-01-01T00:00:00+00:00) - Apple M2 - 8 GB Memory - 256 GB - 10-core GPU - QWERTY'),
  'MacBook Pro 13 (Mid 2022)'
);

assert.equal(
  normalizeBMModelPeriod('MacBook Pro 14 (2023-01-01T00:00:00+00:00)', 'MacBook Pro 14" (2023-01-01T00:00:00+00:00) - Apple M3 Pro 11-core - 18 GB Memory'),
  'MacBook Pro 14 (Late 2023)'
);

assert.equal(
  BM_TO_DEVICE_MAP['MacBook Air 13 (Early 2025)'],
  'MacBook Air 13 M4 A3240'
);
