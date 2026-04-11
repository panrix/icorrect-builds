import type { DeviceCategory } from '../../../shared/types';
import { DEVICE_OPTIONS } from '../../../shared/types';
import { Laptop, Smartphone, Tablet, Watch } from 'lucide-react';
import type { StepComponentProps } from '../flows/types';

const DEVICE_ICONS: Record<DeviceCategory, typeof Smartphone> = {
  iPhone: Smartphone,
  iPad: Tablet,
  MacBook: Laptop,
  'Apple Watch': Watch,
};

export function DeviceStep({ controller }: StepComponentProps) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Device
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Which device needs repair?
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DEVICE_OPTIONS.map((device) => {
            const Icon = DEVICE_ICONS[device];

            return (
              <button
                className="flex min-h-40 w-full flex-col items-start gap-6 rounded-xl border border-border bg-white px-6 py-7 text-left shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
              key={device}
              onClick={() => {
                controller.setField('deviceCategory', device);
                controller.setField('model', '');
                controller.next();
              }}
              type="button"
            >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <Icon className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <span className="text-xl font-semibold tracking-[-0.03em]">{device}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
