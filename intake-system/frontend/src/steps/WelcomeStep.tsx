import { motion } from 'framer-motion';
import { Button } from '../components/Button';

interface WelcomeStepProps {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-8">
      <motion.img
        alt="iCorrect"
        className="mb-8 h-24 w-24 rounded-[28px] shadow-sm ring-1 ring-black/5"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        src="/logo.svg"
        transition={{ duration: 0.35 }}
      />
      <div className="w-full max-w-xl space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Welcome
          </p>
        </motion.div>
        <motion.h1
          className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04 }}
        >
          Welcome to iCorrect
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          Tap below to get started.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="pt-4"
        >
          <Button className="mx-auto w-full max-w-xs" onClick={onStart} size="lg" type="button">
            Get Started
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
