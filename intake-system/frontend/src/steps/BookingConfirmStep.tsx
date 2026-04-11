import type { MondayItem } from '../../../shared/types';
import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';

function formatBookingDate(value: string | null) {
  if (!value) {
    return 'Date pending';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function BookingSummary({ item }: { item: MondayItem }) {
  return (
    <div className="space-y-2">
      <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">
        {item.device} · {item.service}
      </p>
      <p className="text-base text-muted-foreground">Booked: {formatBookingDate(item.bookingDate)}</p>
    </div>
  );
}

export function BookingConfirmStep({ controller }: StepComponentProps) {
  const result = controller.customerLookupResult;
  const matches = result?.mondayItems ?? [];
  const selectedBookingId = controller.data.selectedBooking?.id;
  const singleBooking = matches.length === 1 ? matches[0] : null;

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Appointment
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="text-lg text-muted-foreground">We&apos;re looking for your booking now.</p>
        </div>
        {controller.customerLookupState === 'loading' ? (
          <div className="rounded-[28px] bg-secondary px-6 py-8 text-center">
            <p className="text-base text-muted-foreground">Looking up your booking. This usually takes a moment.</p>
          </div>
        ) : null}
        {controller.customerLookupState === 'error' ? (
          <div className="space-y-4">
            <p className="rounded-2xl border border-destructive/20 bg-red-50 px-4 py-3 text-sm text-destructive">
              {controller.customerLookupError}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => void controller.lookupBookingMatches()} type="button" variant="secondary">
                Try again
              </Button>
            </div>
          </div>
        ) : null}
        {controller.customerLookupState === 'success' && matches.length === 0 ? (
          <div className="space-y-5">
            <div className="rounded-[28px] bg-secondary px-6 py-8 text-center">
              <p className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                We couldn&apos;t find your booking
              </p>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Check the email address with reception, go back and try again, or continue as a walk-in repair.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={controller.back} type="button" variant="secondary">
                Try another email
              </Button>
              <Button onClick={() => controller.chooseFlow('dropoff')} type="button">
                Switch to walk-in
              </Button>
            </div>
          </div>
        ) : null}
        {controller.customerLookupState === 'success' && singleBooking ? (
          <div className="space-y-5">
            <div className="rounded-[28px] border border-border bg-white px-6 py-8">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                We found your booking
              </p>
              <BookingSummary item={singleBooking} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => {
                  controller.setField('bookingConfirmed', true);
                  controller.next();
                }}
                type="button"
              >
                Yes, that&apos;s right
              </Button>
              <Button className="flex-1" onClick={controller.back} type="button" variant="secondary">
                Something&apos;s wrong
              </Button>
            </div>
          </div>
        ) : null}
        {controller.customerLookupState === 'success' && matches.length > 1 ? (
          <div className="space-y-5">
            <p className="text-center text-base text-muted-foreground">
              We found {matches.length} bookings. Please choose the right one.
            </p>
            <div className="space-y-3">
              {matches.map((item) => (
                <button
                  className={`w-full rounded-2xl border px-5 py-5 text-left transition ${
                    selectedBookingId === item.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/40 hover:bg-primary/5'
                  }`}
                  key={item.id}
                  onClick={() => controller.selectBooking(item)}
                  type="button"
                >
                  <p className="mb-2 text-lg font-semibold tracking-[-0.02em] text-foreground">{item.name}</p>
                  <BookingSummary item={item} />
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <Button
                disabled={!controller.data.selectedBooking}
                onClick={() => {
                  controller.setField('bookingConfirmed', true);
                  controller.next();
                }}
                type="button"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
