import { startTransition, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_FORM_DATA,
  type CustomerLookupResponse,
  type FlowType,
  type IntakeFormData,
  type MondayItem,
} from '../../../shared/types';
import { createIntake, lookupCustomer } from '../lib/api';
import { lookupPrice } from '../lib/pricing';
import { FLOW_DEFINITIONS } from '../flows/definitions';
import type { StepId } from '../flows/types';

export type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';
export type ConfirmationMode = 'booking' | 'decline' | null;
export type CustomerLookupState = 'idle' | 'loading' | 'success' | 'error';

export interface UseFlowResult {
  activeFlow: FlowType | null;
  currentStepId: StepId;
  data: IntakeFormData;
  visibleSteps: StepId[];
  currentIndex: number;
  submissionState: SubmissionState;
  submissionError: string | null;
  confirmationMode: ConfirmationMode;
  customerLookupState: CustomerLookupState;
  customerLookupResult: CustomerLookupResponse | null;
  customerLookupError: string | null;
  quote: ReturnType<typeof lookupPrice>;
  progressPercent: number;
  showProgress: boolean;
  canGoBack: boolean;
  start: () => void;
  chooseFlow: (flow: FlowType) => void;
  lookupBookingMatches: () => Promise<void>;
  selectBooking: (booking: MondayItem) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  submit: () => Promise<void>;
  setField: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
}

const BASE_STEPS: StepId[] = ['welcome', 'visit-purpose'];

function getFlowSteps(flow: FlowType | null, data: IntakeFormData): StepId[] {
  if (!flow) {
    return BASE_STEPS;
  }

  const definition = FLOW_DEFINITIONS.find((item) => item.id === flow);
  if (!definition) {
    return BASE_STEPS;
  }

  if (flow !== 'dropoff') {
    return definition.steps;
  }

  const steps = definition.steps.filter((stepId) => {
    if (stepId === 'pre-repair') {
      return data.proceedWithBooking === true;
    }
    return true;
  });

  return steps;
}

export function useFlow(): UseFlowResult {
  const [activeFlow, setActiveFlow] = useState<FlowType | null>(null);
  const [currentStepId, setCurrentStepId] = useState<StepId>('welcome');
  const [data, setData] = useState<IntakeFormData>({ ...INITIAL_FORM_DATA });
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>(null);
  const [customerLookupState, setCustomerLookupState] = useState<CustomerLookupState>('idle');
  const [customerLookupResult, setCustomerLookupResult] = useState<CustomerLookupResponse | null>(null);
  const [customerLookupError, setCustomerLookupError] = useState<string | null>(null);
  const [customerLookupEmail, setCustomerLookupEmail] = useState<string | null>(null);

  const visibleSteps = useMemo(() => getFlowSteps(activeFlow, data), [activeFlow, data]);
  const currentIndex = Math.max(visibleSteps.indexOf(currentStepId), 0);
  const quote = useMemo(
    () => lookupPrice(data.deviceCategory, data.model, data.fault),
    [data.deviceCategory, data.model, data.fault],
  );

  const showProgress =
    activeFlow === 'dropoff' &&
    data.proceedWithBooking === true &&
    currentStepId !== 'confirmation' &&
    currentIndex >= visibleSteps.indexOf('pre-repair');

  const progressPercent =
    showProgress && visibleSteps.length > 1
      ? ((currentIndex + 1) / visibleSteps.length) * 100
      : 0;

  useEffect(() => {
    if (currentStepId !== 'confirmation' || !confirmationMode) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveFlow(null);
      setCurrentStepId('welcome');
      setSubmissionState('idle');
      setSubmissionError(null);
      setConfirmationMode(null);
      setData({ ...INITIAL_FORM_DATA });
    }, 30000);

    return () => window.clearTimeout(timeout);
  }, [confirmationMode, currentStepId]);

  useEffect(() => {
    const email = data.email.trim();
    if (activeFlow !== 'appointment' || currentStepId !== 'booking-confirm' || !email) {
      return;
    }

    if (customerLookupEmail === email) {
      return;
    }

    void (async () => {
      setCustomerLookupState('loading');
      setCustomerLookupError(null);
      setCustomerLookupEmail(email);

      try {
        const result = await lookupCustomer(email);
        setCustomerLookupResult(result);
        setCustomerLookupState('success');
        setData((previous) => {
          const defaultBooking = result.mondayItems.length === 1 ? result.mondayItems[0] : null;
          const selectedBooking = previous.selectedBooking
            ? result.mondayItems.find((item) => item.id === previous.selectedBooking?.id) ?? defaultBooking
            : defaultBooking;

          return {
            ...previous,
            selectedBooking,
            bookingConfirmed: false,
          };
        });
      } catch {
        setCustomerLookupResult(null);
        setCustomerLookupState('error');
        setCustomerLookupError(
          "We're having trouble looking up your booking. Please let reception know you've arrived.",
        );
        setData((previous) => ({
          ...previous,
          selectedBooking: null,
          bookingConfirmed: false,
        }));
      }
    })();
  }, [activeFlow, currentStepId, customerLookupEmail, data.email]);

  const setField = <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => {
    setData((previous) => {
      if (key === 'email') {
        return {
          ...previous,
          [key]: value,
          selectedBooking: null,
          bookingConfirmed: false,
        };
      }

      return {
        ...previous,
        [key]: value,
      };
    });

    if (key === 'email') {
      setCustomerLookupState('idle');
      setCustomerLookupResult(null);
      setCustomerLookupError(null);
      setCustomerLookupEmail(null);
    }
  };

  const start = () => {
    setSubmissionError(null);
    setCurrentStepId('visit-purpose');
  };

  const chooseFlow = (flow: FlowType) => {
    startTransition(() => {
      setSubmissionError(null);
      setSubmissionState('idle');
      setConfirmationMode(null);
      setCustomerLookupState('idle');
      setCustomerLookupResult(null);
      setCustomerLookupError(null);
      setCustomerLookupEmail(null);
      setActiveFlow(flow);
      setData((previous) => ({
        ...previous,
        flowType: flow,
        selectedBooking: flow === 'appointment' ? previous.selectedBooking : null,
        bookingConfirmed: flow === 'appointment' ? previous.bookingConfirmed : false,
        additionalNotes: flow === 'appointment' ? previous.additionalNotes : '',
      }));
      setCurrentStepId('identity');
    });
  };

  const lookupBookingMatches = async () => {
    const email = data.email.trim();
    if (!email) {
      return;
    }

    setCustomerLookupState('loading');
    setCustomerLookupError(null);
    setCustomerLookupEmail(email);

    try {
      const result = await lookupCustomer(email);
      setCustomerLookupResult(result);
      setCustomerLookupState('success');
      setData((previous) => {
        const defaultBooking = result.mondayItems.length === 1 ? result.mondayItems[0] : null;
        const selectedBooking = previous.selectedBooking
          ? result.mondayItems.find((item) => item.id === previous.selectedBooking?.id) ?? defaultBooking
          : defaultBooking;

        return {
          ...previous,
          selectedBooking,
          bookingConfirmed: false,
        };
      });
    } catch {
      setCustomerLookupResult(null);
      setCustomerLookupState('error');
      setCustomerLookupError(
        "We're having trouble looking up your booking. Please let reception know you've arrived.",
      );
      setData((previous) => ({
        ...previous,
        selectedBooking: null,
        bookingConfirmed: false,
      }));
    }
  };

  const selectBooking = (booking: MondayItem) => {
    setData((previous) => ({
      ...previous,
      selectedBooking: booking,
      bookingConfirmed: false,
    }));
  };

  const next = () => {
    const nextStep = visibleSteps[currentIndex + 1];
    if (nextStep) {
      setSubmissionError(null);
      setCurrentStepId(nextStep);
    }
  };

  const back = () => {
    if (currentStepId === 'visit-purpose') {
      setActiveFlow(null);
      setCurrentStepId('welcome');
      return;
    }

    if (currentStepId === 'identity' && activeFlow) {
      setCurrentStepId('visit-purpose');
      return;
    }

    const previousStep = visibleSteps[currentIndex - 1];
    if (previousStep) {
      setSubmissionError(null);
      setCurrentStepId(previousStep);
    }
  };

  const reset = () => {
    setActiveFlow(null);
    setCurrentStepId('welcome');
    setSubmissionState('idle');
    setSubmissionError(null);
    setConfirmationMode(null);
    setCustomerLookupState('idle');
    setCustomerLookupResult(null);
    setCustomerLookupError(null);
    setCustomerLookupEmail(null);
    setData({ ...INITIAL_FORM_DATA });
  };

  const submit = async () => {
    const flowType = activeFlow;
    if (!flowType) {
      return;
    }

    setSubmissionState('submitting');
    setSubmissionError(null);

    try {
      await createIntake({
        idempotencyKey: crypto.randomUUID(),
        flowType,
        formData: {
          ...data,
          flowType,
        },
      });

      setSubmissionState('success');
      setConfirmationMode(data.proceedWithBooking === false ? 'decline' : 'booking');
      setCurrentStepId('confirmation');
    } catch {
      setSubmissionState('error');
      setSubmissionError('We could not save this intake yet. Please let reception know and try again.');
    }
  };

  return {
    activeFlow,
    currentStepId,
    data,
    visibleSteps,
    currentIndex,
    submissionState,
    submissionError,
    confirmationMode,
    customerLookupState,
    customerLookupResult,
    customerLookupError,
    quote,
    progressPercent,
    showProgress,
    canGoBack: currentStepId !== 'welcome' && currentStepId !== 'confirmation',
    start,
    chooseFlow,
    lookupBookingMatches,
    selectBooking,
    next,
    back,
    reset,
    submit,
    setField,
  };
}
