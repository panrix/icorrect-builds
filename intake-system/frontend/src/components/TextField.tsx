import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
}

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  inputClassName,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <label className={cn('flex w-full flex-col gap-2.5', className)} htmlFor={fieldId}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-12 w-full rounded-lg border border-input bg-white px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          error && 'border-destructive focus:ring-destructive',
          inputClassName,
        )}
        id={fieldId}
        {...props}
      />
      {hint ? (
        <span className="text-sm text-muted-foreground" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="text-sm text-destructive" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
