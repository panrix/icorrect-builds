import { useEffect, useRef } from 'react';
import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';
import { TextAreaField } from '../components/TextAreaField';

export function ProceedDecisionStep({ controller }: StepComponentProps) {
  const shouldAdvanceRef = useRef(false);
  const declineReady =
    controller.data.proceedWithBooking === false &&
    controller.data.wantsQuoteEmailed !== null;

  useEffect(() => {
    if (!shouldAdvanceRef.current || controller.data.proceedWithBooking !== true) {
      return;
    }

    shouldAdvanceRef.current = false;
    controller.next();
  }, [controller]);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Next Step
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Would you like to go ahead?
          </h1>
        </div>
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              shouldAdvanceRef.current = true;
              controller.setField('proceedWithBooking', true);
            }}
            size="full"
            type="button"
          >
            Yes, book in my repair
          </Button>
          <Button
            className="w-full"
            onClick={() => controller.setField('proceedWithBooking', false)}
            size="full"
            type="button"
            variant="secondary"
          >
            No thanks
          </Button>
        </div>
        {controller.data.proceedWithBooking === false ? (
          <div className="space-y-5 rounded-[28px] bg-secondary px-5 py-6 sm:px-6">
            <p className="text-base leading-7 text-muted-foreground">
              If you&apos;d like, we can email this quote to you. Please hand the iPad back to reception when you&apos;re done.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className={`rounded-xl border px-4 py-4 text-left text-base font-medium transition ${
                  controller.data.wantsQuoteEmailed === true
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5'
                }`}
                onClick={() => controller.setField('wantsQuoteEmailed', true)}
                type="button"
              >
                Email the quote
              </button>
              <button
                className={`rounded-xl border px-4 py-4 text-left text-base font-medium transition ${
                  controller.data.wantsQuoteEmailed === false
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5'
                }`}
                onClick={() => controller.setField('wantsQuoteEmailed', false)}
                type="button"
              >
                No email needed
              </button>
            </div>
            <TextAreaField
              label="Any reason you’d prefer not to drop off today?"
              onChange={(event) => controller.setField('declineReason', event.target.value)}
              placeholder="Optional"
              rows={4}
              value={controller.data.declineReason}
            />
            <Button
              className="w-full sm:w-auto"
              disabled={!declineReady || controller.submissionState === 'submitting'}
              onClick={() => void controller.submit()}
              type="button"
            >
              {controller.submissionState === 'submitting' ? 'Submitting…' : 'Submit quote request'}
            </Button>
          </div>
        ) : null}
        {controller.submissionError ? (
          <p className="rounded-2xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive">
            {controller.submissionError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
