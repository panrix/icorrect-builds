import type { FlowType } from '../../../shared/types';
import { OptionCard } from '../components/OptionCard';
import type { StepComponentProps } from '../flows/types';

const PURPOSE_COPY: Record<FlowType, { title: string }> = {
  appointment: {
    title: 'I have an appointment',
  },
  dropoff: {
    title: 'Drop off for repair',
  },
  collection: {
    title: 'Collect my device',
  },
  enquiry: {
    title: 'I have a question',
  },
};

const FLOW_ORDER: FlowType[] = ['appointment', 'dropoff', 'collection', 'enquiry'];

export function VisitPurposeStep({ controller }: StepComponentProps) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Visit Purpose
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            What brings you in today?
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FLOW_ORDER.map((flow) => (
            <OptionCard
              className="min-h-36 justify-center rounded-xl px-6 py-7 text-left hover:border-primary/50 hover:bg-primary/5"
              key={flow}
              onClick={() => controller.chooseFlow(flow)}
              selected={controller.activeFlow === flow}
              title={PURPOSE_COPY[flow].title}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
