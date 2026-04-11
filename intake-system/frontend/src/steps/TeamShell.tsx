export function TeamShell() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Team View
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Team intake view</h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              This route is reserved for the operator queue. Queue management and live updates can be layered on here without changing the customer intake flow.
            </p>
          </div>
          <div className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
            Route: /team
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3" aria-label="Queue preview">
          <div className="rounded-2xl border border-border bg-secondary px-5 py-6">
            <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">0</p>
            <p className="mt-2 text-sm text-muted-foreground">Live intakes connected</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary px-5 py-6">
            <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Ready</p>
            <p className="mt-2 text-sm text-muted-foreground">Queue and detail scaffolds</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary px-5 py-6">
            <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">Planned</p>
            <p className="mt-2 text-sm text-muted-foreground">Completion gates and version checks</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-white px-5 py-4 text-sm text-muted-foreground">
            Today&apos;s sessions will appear here once the backend and realtime feed are wired.
          </div>
          <div className="rounded-2xl border border-border bg-white px-5 py-4 text-sm text-muted-foreground">
            Operator actions will be added on the detail view when the team queue is connected.
          </div>
        </div>
      </div>
    </div>
  );
}
