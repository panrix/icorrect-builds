import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OptionCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description?: ReactNode;
  badge?: string;
  selected?: boolean;
}

export function OptionCard({
  title,
  description,
  badge,
  selected = false,
  className,
  ...props
}: OptionCardProps) {
  return (
    <button
      className={cn(
        'flex min-h-32 w-full flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-white p-6 text-left text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]',
        selected && 'border-primary bg-primary/5',
        className,
      )}
      type="button"
      {...props}
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-lg font-semibold tracking-[-0.02em]">{title}</div>
          {description ? <div className="text-sm leading-6 text-muted-foreground">{description}</div> : null}
        </div>
        {badge ? (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}
