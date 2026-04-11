interface ComingSoonStepProps {
  title: string;
  subtitle?: string;
}

export function ComingSoonStep({ title, subtitle }: ComingSoonStepProps) {
  return (
    <div className="space-y-3 rounded-[28px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">Coming Soon</p>
      <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{title}</h2>
      <p className="text-base leading-7 text-muted-foreground">
        {subtitle ?? 'This route is scaffolded and ready for a future pass.'}
      </p>
    </div>
  );
}
