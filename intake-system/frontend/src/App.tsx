import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Shell } from './components/Shell';
import { STEP_REGISTRY } from './flows/registry';
import { useFlow } from './hooks/useFlow';
import { useLocation } from './lib/route';
import { cn } from './lib/utils';
import { TeamShell } from './steps/TeamShell';
import { WelcomeStep } from './steps/WelcomeStep';

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onBack}
      type="button"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="flex w-full max-w-xs items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Progress
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ClientFlow() {
  const controller = useFlow();
  const StepComponent = STEP_REGISTRY[controller.currentStepId];
  const showTopChrome = controller.currentStepId !== 'confirmation';

  if (controller.currentStepId === 'welcome') {
    return <WelcomeStep onStart={controller.start} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {showTopChrome ? (
        <div className="flex min-h-11 items-center justify-between gap-4">
          <div className="min-w-0">
            {controller.canGoBack ? <BackButton onBack={controller.back} /> : null}
          </div>
          <div className="flex flex-1 justify-end">
            {controller.showProgress ? (
              <ProgressBar progress={controller.progressPercent} />
            ) : (
              <div className="h-11" />
            )}
          </div>
        </div>
      ) : null}
      <StepComponent controller={controller} />
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isTeam = location.pathname.startsWith('/team');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isTeam ? 'team' : 'client'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className={cn('w-full')}
      >
        {isTeam ? <TeamShell /> : <ClientFlow />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Shell>
      <AppContent />
    </Shell>
  );
}
