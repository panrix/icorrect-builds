const MODEL_CHIP_MAP = {
  A2337: 'M1',
  A2681: 'M2',
  A3113: 'M3',
  A3114: 'M3',
  A2338: 'M1',
  A2442: 'M1PRO',
  A2485: 'M1PRO',
  A2779: 'M2PRO',
  A2918: 'M3PRO',
  A2992: 'M3PRO',
  A2780: 'M2PRO',
  A2991: 'M3PRO',
  A2941: 'M2',
  A2289: 'I5',
  A2251: 'I5',
};

const CHIP_PATTERNS = [
  { re: /M4\s*Pro/i, chip: 'M4PRO' },
  { re: /M4\s*Max/i, chip: 'M4MAX' },
  { re: /M4/i, chip: 'M4' },
  { re: /M3\s*Pro/i, chip: 'M3PRO' },
  { re: /M3\s*Max/i, chip: 'M3MAX' },
  { re: /M3/i, chip: 'M3' },
  { re: /M2\s*Pro/i, chip: 'M2PRO' },
  { re: /M2\s*Max/i, chip: 'M2MAX' },
  { re: /M2/i, chip: 'M2' },
  { re: /M1\s*Pro/i, chip: 'M1PRO' },
  { re: /M1\s*Max/i, chip: 'M1MAX' },
  { re: /M1/i, chip: 'M1' },
];

function normalizeModel(model) {
  return String(model || '').trim().toUpperCase();
}

function normalizeRam(ram) {
  return String(ram || '').replace(/\s/g, '');
}

function normalizeStorage(ssd) {
  let storage = String(ssd || '').replace(/\s/g, '');
  if (storage === '1000GB') storage = '1TB';
  if (storage === '2000GB') storage = '2TB';
  return storage;
}

function normalizeColour(colour) {
  let col = colour || 'Grey';
  col = String(col).trim();
  col = col.replace('Space Gray', 'Grey').replace('Space Grey', 'Grey');
  return col;
}

function deriveType(specs = {}) {
  const dn = String(specs.deviceName || '').toLowerCase();
  if (dn.includes('air')) return 'MBA';
  if (dn.includes('pro')) return 'MBP';
  return 'MAC';
}

function parseFirstCoreCount(value) {
  return parseInt((String(value || '').match(/(\d+)/) || [])[1] || '0', 10);
}

function deriveChip(specs = {}) {
  const model = normalizeModel(specs.model);
  const cpu = String(specs.cpu || '');
  const gpu = String(specs.gpu || '');
  const deviceName = String(specs.deviceName || '');
  const dn = deviceName.toLowerCase();
  let chip = MODEL_CHIP_MAP[model] || '';

  if (chip && (model === 'A2442' || model === 'A2485')) {
    const gpuCores = parseFirstCoreCount(gpu);
    if (gpuCores >= 24) chip = chip.replace('PRO', 'MAX');
  }

  if (model === 'A2918' || model === 'A2992') {
    const cpuCores = parseFirstCoreCount(cpu);
    const gpuCores = parseFirstCoreCount(gpu);
    if (cpuCores === 8 && gpuCores === 10) chip = 'M3';
  }

  if (model === 'A2338') {
    const gpuCores = parseFirstCoreCount(gpu);
    if (gpuCores === 10) chip = 'M2';
  }

  if (!chip) {
    for (const p of CHIP_PATTERNS) {
      if (p.re.test(dn)) { chip = p.chip; break; }
    }
  }

  if (!chip) {
    const cpuLower = cpu.toLowerCase();
    for (const p of CHIP_PATTERNS) {
      if (p.re.test(cpuLower)) { chip = p.chip; break; }
    }
  }

  if (!chip) {
    const cpuLower = cpu.toLowerCase();
    const gpuLower = gpu.toLowerCase();
    if (cpuLower.includes('i5') || cpuLower === 'i5') chip = 'I5';
    else if (cpuLower.includes('i7') || cpuLower === 'i7') chip = 'I7';
    else if (cpuLower.includes('i9') || cpuLower === 'i9') chip = 'I9';
    else if (cpuLower.includes('i3') || cpuLower === 'i3') chip = 'I3';
    else if (cpuLower.includes('intel') || gpuLower.includes('intel')) chip = 'INTEL';
    else chip = cpu.replace(/\s+/g, '').toUpperCase();
  }

  return chip;
}

function deriveGpuPart(specs = {}) {
  const model = normalizeModel(specs.model);
  const gpu = String(specs.gpu || '');
  const variableGpuModels = ['A2337', 'A2681'];
  if (!variableGpuModels.includes(model) || !gpu) return '';
  const coreMatch = gpu.match(/(\d+)/);
  return coreMatch ? `${coreMatch[1]}C` : '';
}

function constructBmSku(specs = {}, gradeText = '') {
  const model = normalizeModel(specs.model);
  const type = deriveType(specs);
  const chip = deriveChip({ ...specs, model });
  const gpuPart = deriveGpuPart({ ...specs, model });
  const ramStr = normalizeRam(specs.ram);
  const storage = normalizeStorage(specs.ssd);
  const col = normalizeColour(specs.colour);
  const grade = String(gradeText || '').trim();
  const parts = [type, model, chip, gpuPart, ramStr, storage, col, grade].filter(Boolean);
  return parts.join('.');
}

function validateSku({ storedSku, expectedSku } = {}) {
  const stored = String(storedSku || '').trim();
  const expected = String(expectedSku || '').trim();
  if (!expected) {
    return { ok: false, code: 'EXPECTED_SKU_MISSING', storedSku: stored || null, expectedSku: expected || null };
  }
  if (!stored) {
    return { ok: false, code: 'QC_SKU_MISSING', storedSku: null, expectedSku: expected };
  }
  if (stored !== expected) {
    return { ok: false, code: 'QC_SKU_MISMATCH', storedSku: stored, expectedSku: expected };
  }
  return { ok: true, code: 'SKU_MATCH', storedSku: stored, expectedSku: expected };
}

module.exports = {
  constructBmSku,
  validateSku,
  normalizeModel,
  normalizeRam,
  normalizeStorage,
  normalizeColour,
  deriveType,
  deriveChip,
  deriveGpuPart,
};
