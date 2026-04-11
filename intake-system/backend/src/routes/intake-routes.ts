import { Router } from 'express';
import type {
  AddNotesRequest,
  CompleteIntakeRequest,
  CreateIntakeRequest,
  DeclineIntakeRequest,
  RecordCheckRequest,
  UpdateIntakeRequest,
} from '../../../shared/types';
import type { IntakeService } from '../services/intake-service';

export function createIntakeRouter(service: IntakeService) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const result = await service.createIntake(req.body as CreateIntakeRequest);
      res.status(result.created ? 201 : 200).json(result.response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/today', async (_req, res, next) => {
    try {
      const response = await service.getTodayIntakes();
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const response = await service.getIntake(req.params.id);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const response = await service.updateIntake(req.params.id, req.body as UpdateIntakeRequest);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/notes', async (req, res, next) => {
    try {
      const response = await service.addNotes(req.params.id, req.body as AddNotesRequest);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/complete', async (req, res, next) => {
    try {
      const response = await service.completeIntake(req.params.id, req.body as CompleteIntakeRequest);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/decline', async (req, res, next) => {
    try {
      const response = await service.declineIntake(req.params.id, req.body as DeclineIntakeRequest);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/checks', async (req, res, next) => {
    try {
      const response = await service.recordCheck(req.params.id, req.body as RecordCheckRequest);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
