import { useMemo, useState } from 'react';
import type { StepComponentProps } from '../flows/types';
import { TextField } from '../components/TextField';
import { getModelsForCategory } from '../lib/pricing';

export function ModelStep({ controller }: StepComponentProps) {
  const [query, setQuery] = useState('');
  const models = useMemo(() => {
    const allModels = getModelsForCategory(controller.data.deviceCategory);
    if (!query.trim()) {
      return allModels;
    }

    const normalizedQuery = query.toLowerCase();
    return allModels.filter((model) => model.toLowerCase().includes(normalizedQuery));
  }, [controller.data.deviceCategory, query]);
  const displayModels = models.slice(0, 24);

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[32px] bg-white px-6 py-8 shadow-sm ring-1 ring-black/5 sm:px-10 sm:py-10">
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Model
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Which model?
          </h1>
        </div>
        <TextField
          label="Search models"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${controller.data.deviceCategory ?? 'device'} models`}
          value={query}
        />
        <div className="max-h-[24rem] overflow-y-auto rounded-2xl border border-border bg-white">
          {displayModels.length > 0 ? (
            displayModels.map((model) => (
              <button
                className="flex w-full items-center justify-between gap-4 border-b border-border px-5 py-4 text-left transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                key={model}
                onClick={() => {
                  controller.setField('model', model);
                  controller.next();
                }}
                type="button"
              >
                <span className="text-base font-medium text-foreground">{model}</span>
              </button>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No models matched that search.
            </div>
          )}
        </div>
        <div className="pt-2">
          <button
            className="w-full rounded-xl border border-border bg-secondary px-5 py-4 text-left text-base font-medium text-foreground transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
            onClick={() => {
              controller.setField('model', "I'm not sure");
              controller.next();
            }}
            type="button"
          >
            I&apos;m not sure
          </button>
        </div>
      </div>
    </div>
  );
}
