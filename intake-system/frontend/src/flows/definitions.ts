import type { FlowDefinition } from './types';

export const FLOW_DEFINITIONS: FlowDefinition[] = [
  {
    id: 'appointment',
    label: 'Booked appointment',
    steps: ['welcome', 'visit-purpose', 'identity', 'booking-confirm', 'additional-notes', 'confirmation'],
  },
  {
    id: 'dropoff',
    label: 'Walk-in repair',
    steps: [
      'welcome',
      'visit-purpose',
      'identity',
      'device',
      'model',
      'fault',
      'pricing-gate',
      'proceed-decision',
      'pre-repair',
      'confirmation',
    ],
  },
  {
    id: 'collection',
    label: 'Collection',
    steps: ['welcome', 'visit-purpose', 'identity', 'device', 'collection-questions', 'confirmation'],
  },
  {
    id: 'enquiry',
    label: 'Enquiry',
    steps: ['welcome', 'visit-purpose', 'identity', 'device', 'fault', 'confirmation'],
  },
];
