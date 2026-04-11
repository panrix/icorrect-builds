import type { ComponentType } from 'react';
import type { FlowType, IntakeFormData } from '../../../shared/types';
import type { UseFlowResult } from '../hooks/useFlow';

export type StepId =
  | 'welcome'
  | 'visit-purpose'
  | 'identity'
  | 'device'
  | 'model'
  | 'fault'
  | 'pricing-gate'
  | 'proceed-decision'
  | 'pre-repair'
  | 'confirmation'
  | 'booking-confirm'
  | 'additional-notes'
  | 'collection-questions';

export interface FlowDefinition {
  id: FlowType;
  label: string;
  steps: StepId[];
}

export interface FlowStateSnapshot {
  activeFlow: FlowType | null;
  currentStepId: StepId;
  data: IntakeFormData;
}

export interface StepComponentProps {
  controller: UseFlowResult;
}

export type StepComponent = ComponentType<StepComponentProps>;
