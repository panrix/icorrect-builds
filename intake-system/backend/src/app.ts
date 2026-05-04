import express from 'express';
import {
  MockIntercomAdapter,
  MockLLMSummaryAdapter,
  MockMondayAdapter,
  MockTelegramAdapter,
} from './adapters/mock-adapters';
import { TelegramApiAdapter } from './adapters/telegram-api-adapter';
import type {
  IntercomAdapter,
  LLMSummaryAdapter,
  MondayAdapter,
  TelegramAdapter,
} from './adapters/types';
import { getEnv } from './config/env';
import { createCustomerRouter } from './routes/customer-routes';
import { createHealthRouter } from './routes/health-routes';
import { createIntakeRouter } from './routes/intake-routes';
import { createTelegramRouter } from './routes/telegram-routes';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import {
  type IntakeRepository,
  InMemoryIntakeRepository,
} from './repositories/intake-repository';
import { IntakeService } from './services/intake-service';

export interface AppDependencies {
  repository?: IntakeRepository;
  mondayAdapter?: MondayAdapter;
  intercomAdapter?: IntercomAdapter;
  llmSummaryAdapter?: LLMSummaryAdapter;
  telegramAdapter?: TelegramAdapter;
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const env = getEnv();
  const repository = dependencies.repository ?? new InMemoryIntakeRepository();
  const intakeService = new IntakeService(
    repository,
    dependencies.mondayAdapter ?? new MockMondayAdapter(),
    dependencies.intercomAdapter ?? new MockIntercomAdapter(),
    dependencies.llmSummaryAdapter ?? new MockLLMSummaryAdapter(),
    dependencies.telegramAdapter
      ?? (env.telegramBotToken ? new TelegramApiAdapter(env.telegramBotToken) : new MockTelegramAdapter()),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/health', createHealthRouter('0.1.0'));
  app.use('/api/customer', createCustomerRouter(intakeService));
  app.use('/api/intake', createIntakeRouter(intakeService));
  app.use('/api/telegram', createTelegramRouter(intakeService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
