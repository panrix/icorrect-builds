import { motion } from 'framer-motion';
import type { StepComponentProps } from '../flows/types';
import { Button } from '../components/Button';

export function ConfirmationStep({ controller }: StepComponentProps) {
  const name = controller.data.name || 'there';
  const isDecline = controller.confirmationMode === 'decline';
  const isCollection = controller.activeFlow === 'collection';
  const isEnquiry = controller.activeFlow === 'enquiry';
  const deviceLabel = controller.data.deviceCategory ? controller.data.deviceCategory.toLowerCase() : 'device';

  const badge = isDecline
    ? 'Quote saved'
    : isCollection
      ? 'Collection queued'
      : isEnquiry
        ? 'Enquiry sent'
        : controller.activeFlow === 'appointment'
          ? 'Arrival recorded'
          : 'Intake submitted';

  const title = `Thank you, ${name}`;

  const copy = isDecline
    ? 'Please hand the iPad back to reception. We have captured your quote preference and the team can follow up from there.'
    : isCollection
      ? `We’ll bring your ${deviceLabel} out shortly. Please wait at reception.`
      : isEnquiry
        ? 'A member of our team will help you shortly. Please wait at reception.'
        : controller.activeFlow === 'appointment'
          ? 'A member of our team will be with you shortly. Please take a seat.'
          : 'A member of our team will be with you shortly. Please take a seat.';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-[32px] bg-white px-6 py-12 text-center shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-14">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]"
        initial={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.svg
          animate={{ pathLength: 1 }}
          className="h-10 w-10"
          fill="none"
          initial={{ pathLength: 0 }}
          viewBox="0 0 24 24"
        >
          <motion.path
            d="M5 12.5L9.5 17L19 7.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            transition={{ duration: 0.45, delay: 0.1 }}
          />
        </motion.svg>
      </motion.div>
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">{badge}</p>
      <h1 className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-lg text-lg leading-8 text-muted-foreground">{copy}</p>
      <Button className="mt-8" onClick={controller.reset} type="button" variant="ghost">
        Start new
      </Button>
    </div>
  );
}
