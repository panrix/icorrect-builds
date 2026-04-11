import { Router } from 'express';
import type { HealthResponse } from '../../../shared/types';

export function createHealthRouter(version: string) {
  const router = Router();

  router.get('/', (_req, res) => {
    const response: HealthResponse = {
      status: 'ok',
      uptime: process.uptime(),
      version,
    };

    res.json(response);
  });

  return router;
}
