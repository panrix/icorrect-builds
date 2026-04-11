import type { ReactNode } from 'react';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 pt-6 sm:px-8">
        <img alt="iCorrect" className="h-8 w-8 rounded-xl" src="/logo.svg" />
        <span className="text-sm font-medium text-muted-foreground">iCorrect</span>
      </header>
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
