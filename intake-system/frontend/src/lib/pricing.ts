import type { DeviceCategory, FaultCategory } from '../../../shared/types';
import rawData from '../../../pricing-data.json';

type PricingMatrix = Record<string, Record<string, Record<string, { price: number }>>>;

const pricingData = rawData as PricingMatrix;

const FAULT_TO_PRICING_KEY: Record<FaultCategory, string[]> = {
  Screen: ['Screen', 'Glass', 'LCD', 'Screen Lines'],
  Battery: ['Battery'],
  Charging: ['Charging Port'],
  Keyboard: ['Keyboard'],
  'Liquid Damage': ['Diagnostic'],
  'Not Turning On': ['Diagnostic'],
  Diagnostic: ['Diagnostic'],
  Other: ['Other', 'Diagnostic'],
};

export interface PricingQuote {
  price: number;
  turnaround: string;
}

export function lookupPrice(
  deviceCategory: DeviceCategory | null,
  model: string,
  fault: FaultCategory | null,
): PricingQuote | null {
  if (!deviceCategory || !model || !fault) {
    return null;
  }

  const categoryData = pricingData[deviceCategory];
  const modelData = categoryData?.[model];
  if (!modelData) {
    return null;
  }

  for (const key of FAULT_TO_PRICING_KEY[fault]) {
    if (modelData[key]) {
      return {
        price: modelData[key].price,
        turnaround: getTurnaround(deviceCategory, fault),
      };
    }
  }

  return null;
}

export function getModelsForCategory(deviceCategory: DeviceCategory | null): string[] {
  if (!deviceCategory) {
    return [];
  }

  return Object.keys(pricingData[deviceCategory] ?? {}).filter(
    (model) => !model.includes('TEST') && !model.includes('Zebra') && !model.includes('iPod'),
  );
}

function getTurnaround(deviceCategory: DeviceCategory, fault: FaultCategory) {
  if (fault === 'Liquid Damage') return '3-5 working days';
  if (fault === 'Not Turning On') return '1-3 working days';
  if (fault === 'Diagnostic') return '1-2 working days';

  if (deviceCategory === 'iPhone') {
    if (fault === 'Screen' || fault === 'Battery') return 'Same day';
    return '1-2 working days';
  }

  if (deviceCategory === 'iPad') return '2-3 working days';
  if (deviceCategory === 'Apple Watch') return '3-5 working days';
  if (fault === 'Screen') return '3-5 working days';
  if (fault === 'Battery' || fault === 'Keyboard') return '2-3 working days';
  return '2-5 working days';
}
