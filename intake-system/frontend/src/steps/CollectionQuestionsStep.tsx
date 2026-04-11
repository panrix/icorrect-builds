import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';
import { TextAreaField } from '../components/TextAreaField';

export function CollectionQuestionsStep({ controller }: StepComponentProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Collection
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Collecting your device
          </h1>
          <p className="text-lg text-muted-foreground">
            Do you have any questions about your repair?
          </p>
        </div>
        <TextAreaField
          hint="Optional"
          label="Collection question"
          onChange={(event) => controller.setField('collectionQuestions', event.target.value)}
          placeholder="Anything you'd like us to go over before handover"
          rows={5}
          value={controller.data.collectionQuestions}
        />
        {controller.submissionError ? (
          <p className="rounded-2xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive">
            {controller.submissionError}
          </p>
        ) : null}
        <div>
          <Button
            className="w-full sm:w-auto"
            disabled={controller.submissionState === 'submitting'}
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
