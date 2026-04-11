import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';

export function PricingGateStep({ controller }: StepComponentProps) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Pricing
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            {controller.data.fault ?? 'Repair'} {controller.data.model ? `for ${controller.data.model}` : ''}
          </h1>
        </div>
        <div className="space-y-4 rounded-[28px] bg-secondary px-6 py-8">
          {controller.quote ? (
            <>
              <p className="text-5xl font-bold tracking-[-0.05em] text-foreground sm:text-6xl">
                £{controller.quote.price}
              </p>
              <p className="text-lg text-muted-foreground">
                {controller.quote.turnaround}
              </p>
              <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">
                We use quality-tested parts for all our repairs.
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                Quote on inspection
              </p>
              <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground">
                We&apos;ll confirm your quote when we inspect the device.
              </p>
            </>
          )}
        </div>
        <div>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              controller.setField('seenPricing', true);
              controller.next();
            }}
            type="button"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
