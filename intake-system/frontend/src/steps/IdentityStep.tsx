import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

export function IdentityStep({ controller }: StepComponentProps) {
  const requiresPhone = controller.activeFlow === 'dropoff';
  const phoneDigits = controller.data.phone.replace(/\D/g, '');
  const canContinue =
    controller.data.name.trim().length > 1 &&
    EMAIL_PATTERN.test(controller.data.email) &&
    (!requiresPhone || phoneDigits.length >= 10);
  const nameError =
    controller.data.name.length > 0 && controller.data.name.trim().length < 2
      ? 'Please enter your full name.'
      : undefined;
  const emailError =
    controller.data.email.length > 0 && !EMAIL_PATTERN.test(controller.data.email)
      ? 'Enter a valid email address.'
      : undefined;
  const phoneError =
    requiresPhone && controller.data.phone.length > 0 && phoneDigits.length < 10
      ? 'Enter a valid phone number.'
      : undefined;

  return (
    <div className="mx-auto w-full max-w-md rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Your Details
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Your details
          </h1>
        </div>
        <div className="space-y-5">
          <TextField
            autoComplete="name"
            error={nameError}
            label="Full name"
            onChange={(event) => controller.setField('name', event.target.value)}
            placeholder="John Smith"
            value={controller.data.name}
          />
          <TextField
            autoComplete="email"
            error={emailError}
            label="Email address"
            onChange={(event) => controller.setField('email', event.target.value)}
            placeholder="john@example.com"
            type="email"
            value={controller.data.email}
          />
          {requiresPhone ? (
            <TextField
              autoComplete="tel"
              error={phoneError}
              hint="Walk-in repairs only"
              label="Phone number"
              onChange={(event) => controller.setField('phone', event.target.value)}
              placeholder="07123 456789"
              type="tel"
              value={controller.data.phone}
            />
          ) : null}
        </div>
        {controller.submissionError ? (
          <p className="rounded-2xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive">
            {controller.submissionError}
          </p>
        ) : null}
        <div>
          <Button className="w-full" disabled={!canContinue} onClick={controller.next} size="full" type="button">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
