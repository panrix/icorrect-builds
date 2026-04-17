#!/usr/bin/env node

const aNumberMap = require('../../data/A_NUMBER_MAP.json');

if (
  !aNumberMap ||
  typeof aNumberMap !== 'object' ||
  !aNumberMap.mappings ||
  typeof aNumberMap.mappings !== 'object'
) {
  throw new Error('Invalid A_NUMBER_MAP.json: missing mappings object');
}

const testCases = [
  { a_number: 'A1466', expected_scraper_model: null, notes: 'MacBook Air 13 2017 has no canonical V7 family label yet' },
  { a_number: 'A1932', expected_scraper_model: null, notes: 'MacBook Air 13 2018/2019 Intel remains manual until V7 exposes a family label' },
  { a_number: 'A2179', expected_scraper_model: null, notes: 'MacBook Air 13 2020 Intel fallback stays disabled' },
  { a_number: 'A2337', expected_scraper_model: 'Air 13" 2020 M1', notes: 'MacBook Air 13 M1 exact V7 label' },
  { a_number: 'A2681', expected_scraper_model: 'Air 13" 2022 M2', notes: 'MacBook Air 13 M2 exact V7 label' },
  { a_number: 'A2941', expected_scraper_model: 'Air 15" 2023 M2', notes: 'MacBook Air 15 M2 exact V7 label' },
  { a_number: 'A3113', expected_scraper_model: 'Air 13" 2024 M3', notes: 'MacBook Air 13 M3 exact V7 label' },
  { a_number: 'A3114', expected_scraper_model: null, notes: 'MacBook Air 15 M3 has no current V7 family label' },
  { a_number: 'A3240', expected_scraper_model: 'Air 13" 2025 M4', notes: 'MacBook Air 13 M4 exact V7 label' },
  { a_number: 'A3241', expected_scraper_model: null, notes: 'MacBook Air 15 M4 has no current V7 family label' },
  { a_number: 'A2159', expected_scraper_model: null, notes: 'MacBook Pro 13 2019 Intel remains manual' },
  { a_number: 'A2251', expected_scraper_model: null, notes: 'MacBook Pro 13 2020 Intel remains manual' },
  { a_number: 'A2289', expected_scraper_model: null, notes: 'MacBook Pro 13 2020 Intel fallback stays disabled' },
  { a_number: 'A2338', expected_scraper_model: null, notes: 'A2338 is shared by Pro 13 M1 2020 and Pro 13 M2 2022' },
  { a_number: 'A2338', expected_scraper_model: null, notes: 'A2338 cannot collapse two exact V7 labels into one fallback' },
  { a_number: 'A2442', expected_scraper_model: null, notes: 'A2442 spans Pro 14 M1 Pro and M1 Max families' },
  { a_number: 'A2442', expected_scraper_model: null, notes: 'A2442 remains manual because V7 splits M1 Pro and M1 Max' },
  { a_number: 'A2485', expected_scraper_model: null, notes: 'A2485 spans Pro 16 M1 Pro and M1 Max families' },
  { a_number: 'A2485', expected_scraper_model: null, notes: 'A2485 remains manual because V7 splits M1 Pro and M1 Max' },
  { a_number: 'A2779', expected_scraper_model: 'Pro 14" 2023 M2 Pro', notes: 'A2779 standardises on the only V7 family label for 14-inch 2023 M2 Pro/Max' },
  { a_number: 'A2780', expected_scraper_model: 'Pro 16" 2023 M2 Pro', notes: 'A2780 standardises on the only V7 family label for 16-inch 2023 M2 Pro/Max' },
  { a_number: 'A2918', expected_scraper_model: 'Pro 14" 2023 M3', notes: 'A2918 is the base 14-inch 2023 M3 chassis' },
  { a_number: 'A2991', expected_scraper_model: 'Pro 16" 2023 M3 Pro', notes: 'A2991 is the 16-inch 2023 M3 Pro/Max chassis in V7 terms' },
  { a_number: 'A2992', expected_scraper_model: 'Pro 14" 2023 M3 Pro', notes: 'A2992 is the 14-inch 2023 M3 Pro/Max chassis in V7 terms' },
  { a_number: 'A2993', expected_scraper_model: null, notes: 'MacBook Pro 16 2024 M4 family still needs manual verification against V7' },
  { a_number: 'A2681', expected_scraper_model: 'Air 13" 2022 M2', notes: 'Regression: A2681 must not drift to Pro 13 M2' },
  { a_number: 'A2779', expected_scraper_model: 'Pro 14" 2023 M2 Pro', notes: 'Regression: M2 Max variants still collapse to the shared 14-inch 2023 V7 family' },
  { a_number: 'A2780', expected_scraper_model: 'Pro 16" 2023 M2 Pro', notes: 'Regression: M2 Max variants still collapse to the shared 16-inch 2023 V7 family' },
  { a_number: 'A2991', expected_scraper_model: 'Pro 16" 2023 M3 Pro', notes: 'Regression: A2991 must stay on the 16-inch family, not the 14-inch base M3 family' },
  { a_number: 'A2992', expected_scraper_model: 'Pro 14" 2023 M3 Pro', notes: 'Regression: A2992 must stay on the 14-inch Pro family, not the 16-inch family' }
];

let passed = 0;

for (const testCase of testCases) {
  const actual = aNumberMap.mappings?.[testCase.a_number]?.scraper_model ?? null;
  const didPass = actual === testCase.expected_scraper_model;
  if (didPass) {
    passed += 1;
  }
  const actualLabel = actual === null ? 'null' : `"${actual}"`;
  const expectedLabel =
    testCase.expected_scraper_model === null
      ? 'null'
      : `"${testCase.expected_scraper_model}"`;
  const message = didPass
    ? `PASS ${testCase.a_number} ${testCase.notes}`
    : `FAIL ${testCase.a_number} ${testCase.notes} expected=${expectedLabel} actual=${actualLabel}`;
  console.log(message);
}

console.log(`${passed}/${testCases.length} passed`);

if (passed !== testCases.length) {
  process.exitCode = 1;
}
