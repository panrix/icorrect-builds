import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  textareaClassName?: string;
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className,
  textareaClassName,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <label className={cn('flex w-full flex-col gap-2.5', className)} htmlFor={fieldId}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'min-h-32 w-full rounded-xl border border-input bg-white px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          error && 'border-destructive focus:ring-destructive',
          textareaClassName,
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
