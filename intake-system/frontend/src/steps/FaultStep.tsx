import { FAULT_OPTIONS } from '../../../shared/types';
import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';
import { OptionCard } from '../components/OptionCard';
import { TextAreaField } from '../components/TextAreaField';

export function FaultStep({ controller }: StepComponentProps) {
  const isEnquiryFlow = controller.activeFlow === 'enquiry';
  const faultOptions = controller.data.deviceCategory === 'MacBook'
    ? FAULT_OPTIONS
    : FAULT_OPTIONS.filter((option) => option !== 'Keyboard');
  const gridClass =
    faultOptions.length > 4 ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-1 gap-4 sm:grid-cols-2';

  return (
    <div className="mx-auto w-full max-w-4xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Repair Details
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            What&apos;s the issue?
          </h1>
        </div>
        <div className={gridClass}>
          {faultOptions.map((fault) => (
            <OptionCard
              className="min-h-28 rounded-xl px-5 py-6"
              key={fault}
              onClick={() => controller.setField('fault', fault)}
              selected={controller.data.fault === fault}
              title={fault}
            />
          ))}
        </div>
        <TextAreaField
          hint="Optional"
          label="Describe the issue"
          onChange={(event) => controller.setField('faultDescription', event.target.value)}
          placeholder="Add any extra detail here"
          rows={4}
          value={controller.data.faultDescription}
        />
        <div>
          <Button
            className="w-full sm:w-auto"
            disabled={!controller.data.fault || controller.submissionState === 'submitting'}
            onClick={isEnquiryFlow ? () => void controller.submit() : controller.next}
            type="button"
          >
            {isEnquiryFlow
              ? controller.submissionState === 'submitting'
                ? 'Submitting…'
                : 'Submit enquiry'
              : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
