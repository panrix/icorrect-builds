import express from 'express';
import { MockIntercomAdapter, MockLLMSummaryAdapter, MockMondayAdapter } from './adapters/mock-adapters';
import { createCustomerRouter } from './routes/customer-routes';
import { createHealthRouter } from './routes/health-routes';
import { createIntakeRouter } from './routes/intake-routes';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { InMemoryIntakeRepository } from './repositories/intake-repository';
import { IntakeService } from './services/intake-service';

export function createApp() {
  const app = express();
  const repository = new InMemoryIntakeRepository();
  const intakeService = new IntakeService(
    repository,
    new MockMondayAdapter(),
    new MockIntercomAdapter(),
    new MockLLMSummaryAdapter(),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/health', createHealthRouter('0.1.0'));
  app.use('/api/customer', createCustomerRouter(intakeService));
  app.use('/api/intake', createIntakeRouter(intakeService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
