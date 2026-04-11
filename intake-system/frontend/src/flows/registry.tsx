import { AdditionalNotesStep } from '../steps/AdditionalNotesStep';
import { BookingConfirmStep } from '../steps/BookingConfirmStep';
import type { StepComponent } from './types';
import { CollectionQuestionsStep } from '../steps/CollectionQuestionsStep';
import { ConfirmationStep } from '../steps/ConfirmationStep';
import { DeviceStep } from '../steps/DeviceStep';
import { FaultStep } from '../steps/FaultStep';
import { IdentityStep } from '../steps/IdentityStep';
import { ModelStep } from '../steps/ModelStep';
import { PreRepairStep } from '../steps/PreRepairStep';
import { PricingGateStep } from '../steps/PricingGateStep';
import { ProceedDecisionStep } from '../steps/ProceedDecisionStep';
import { TeamShell } from '../steps/TeamShell';
import { VisitPurposeStep } from '../steps/VisitPurposeStep';
import type { StepId } from './types';

export const STEP_REGISTRY: Record<StepId, StepComponent> = {
  welcome: () => null,
  'visit-purpose': VisitPurposeStep,
  identity: IdentityStep,
  device: DeviceStep,
  model: ModelStep,
  fault: FaultStep,
  'pricing-gate': PricingGateStep,
  'proceed-decision': ProceedDecisionStep,
  'pre-repair': PreRepairStep,
  confirmation: ConfirmationStep,
  'booking-confirm': BookingConfirmStep,
  'additional-notes': AdditionalNotesStep,
  'collection-questions': CollectionQuestionsStep,
};

export const ROUTE_REGISTRY = {
  team: TeamShell,
};
