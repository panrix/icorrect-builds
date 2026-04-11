import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';
import { TextAreaField } from '../components/TextAreaField';

export function AdditionalNotesStep({ controller }: StepComponentProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Additional Notes
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Anything else we should know?
          </h1>
        </div>
        <TextAreaField
          hint="Optional"
          label="Arrival note"
          onChange={(event) => controller.setField('additionalNotes', event.target.value)}
          placeholder="Add any changes, questions, or extra context here."
          rows={5}
          value={controller.data.additionalNotes}
        />
        {controller.submissionError ? (
          <p className="rounded-2xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive">
            {controller.submissionError}
          </p>
        ) : null}
        <div>
          <Button
            className="w-full sm:w-auto"
            disabled={controller.submissionState === 'submitting' || !controller.data.selectedBooking}
            onClick={() => void controller.submit()}
            type="button"
          >
            {controller.submissionState === 'submitting' ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
