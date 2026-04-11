import type { DataBackupStatus, DeliveryPreference } from '../../../shared/types';
import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';

const YES_NO = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
] as const;

const BACKUP_OPTIONS: { label: string; value: DataBackupStatus }[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: "I don't know", value: 'unknown' },
];

const DELIVERY_OPTIONS: { label: string; value: DeliveryPreference }[] = [
  { label: 'Deliver back (free)', value: 'deliver' },
  { label: "I'll collect", value: 'collect' },
];

export function PreRepairStep({ controller }: StepComponentProps) {
  const highRiskBackupCopy =
    controller.data.fault === 'Liquid Damage' || controller.data.fault === 'Not Turning On';
  const canSubmit =
    controller.data.repairedBefore !== null &&
    controller.data.appleSeen !== null &&
    controller.data.dataBackedUp !== null &&
    controller.data.passcodeAcknowledged &&
    controller.data.deliveryPreference !== null;

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Final Checks
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Just a few more questions
          </h1>
        </div>
        <div className="space-y-6">
          <QuestionRow
            testId="question-repaired-before"
            options={YES_NO}
            title="Has this device been repaired before?"
            value={controller.data.repairedBefore}
            onSelect={(value) => controller.setField('repairedBefore', value)}
          />
          <QuestionRow
            testId="question-apple-seen"
            options={YES_NO}
            title="Has Apple seen this device?"
            value={controller.data.appleSeen}
            onSelect={(value) => controller.setField('appleSeen', value)}
          />
          <QuestionRow
            testId="question-data-backed-up"
            options={BACKUP_OPTIONS}
            title={highRiskBackupCopy ? 'Do you have a backup of your data?' : 'Is your data backed up?'}
            value={controller.data.dataBackedUp}
            onSelect={(value) => controller.setField('dataBackedUp', value)}
          />
          <QuestionRow
            testId="question-delivery"
            options={DELIVERY_OPTIONS}
            title="How should we return the device?"
            value={controller.data.deliveryPreference}
            onSelect={(value) => controller.setField('deliveryPreference', value)}
          />
          <label
            className="flex items-start gap-3 rounded-2xl border border-border bg-secondary px-4 py-4"
            data-testid="question-passcode"
            htmlFor="passcode-acknowledged"
          >
            <input
              checked={controller.data.passcodeAcknowledged}
              className="mt-1 h-5 w-5 rounded border-input accent-[var(--color-primary)]"
              id="passcode-acknowledged"
              onChange={(event) => controller.setField('passcodeAcknowledged', event.target.checked)}
              type="checkbox"
            />
            <span className="text-base leading-7 text-foreground">
              I&apos;ll have my passcode ready for testing.
            </span>
          </label>
        </div>
        {controller.submissionError ? (
          <p className="rounded-2xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive">
            {controller.submissionError}
          </p>
        ) : null}
        <div>
          <Button
            className="w-full sm:w-auto"
            disabled={!canSubmit || controller.submissionState === 'submitting'}
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

interface QuestionRowProps<T extends string | boolean | null> {
  testId: string;
  title: string;
  value: T;
  onSelect: (value: T) => void;
  options: ReadonlyArray<{ label: string; value: T }>;
}

function QuestionRow<T extends string | boolean | null>({
  testId,
  title,
  value,
  onSelect,
  options,
}: QuestionRowProps<T>) {
  return (
    <div className="space-y-3" data-testid={testId}>
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            className={`min-w-[7rem] rounded-xl border px-5 py-3.5 text-base font-medium transition ${
              value === option.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5'
            }`}
            key={String(option.label)}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
