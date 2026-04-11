import { Router } from 'express';
import type { IntakeService } from '../services/intake-service';

export function createCustomerRouter(service: IntakeService) {
  const router = Router();

  router.get('/lookup', async (req, res, next) => {
    try {
      const email = String(req.query.email ?? '');
      const groupIds = String(req.query.groupIds ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const response = await service.lookupCustomer(email, groupIds);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
