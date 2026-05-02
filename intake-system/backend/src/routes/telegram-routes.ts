import { Router } from 'express';
import type {
  AddNotesRequest,
  CompleteIntakeRequest,
  TelegramFieldCaptureRequest,
  TelegramModelChangeRequest,
  TelegramPasscodeRequest,
  TelegramStockCheckRequest,
  TelegramSyncRequest,
  TelegramTurnaroundRequest,
} from '../../../shared/types';
import type { IntakeService } from '../services/intake-service';

export function createTelegramRouter(service: IntakeService) {
  const router = Router();

  router.get('/intakes/:id', async (req, res, next) => {
    try {
      const response = await service.getTelegramThread(req.params.id);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/sync', async (req, res, next) => {
    try {
      const response = await service.syncTelegramThread(req.params.id, req.body as TelegramSyncRequest);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/intakes/:id/models', async (req, res, next) => {
    try {
      const response = await service.searchTelegramModels(req.params.id, String(req.query.q ?? ''));
      res.json({ models: response });
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/field', async (req, res, next) => {
    try {
      const response = await service.captureTelegramField(
        req.params.id,
        req.body as TelegramFieldCaptureRequest,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/model', async (req, res, next) => {
    try {
      const response = await service.changeTelegramModel(
        req.params.id,
        req.body as TelegramModelChangeRequest,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/passcode', async (req, res, next) => {
    try {
      const response = await service.captureTelegramPasscode(
        req.params.id,
        req.body as TelegramPasscodeRequest,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/stock', async (req, res, next) => {
    try {
      const response = await service.checkTelegramStock(
        req.params.id,
        req.body as TelegramStockCheckRequest,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/turnaround', async (req, res, next) => {
    try {
      const response = await service.confirmTelegramTurnaround(
        req.params.id,
        req.body as TelegramTurnaroundRequest,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/notes', async (req, res, next) => {
    try {
      const response = await service.addTelegramNote(
        req.params.id,
        req.body as AddNotesRequest,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/intakes/:id/actions/previous-notes', async (req, res, next) => {
    try {
      const response = await service.getTelegramPreviousNotes(req.params.id);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post('/intakes/:id/actions/complete', async (req, res, next) => {
    try {
      const session = await service.getIntake(req.params.id);
      const response = await service.completeIntake(req.params.id, {
        ...(req.body as CompleteIntakeRequest),
        version: (req.body as CompleteIntakeRequest).version ?? session.version,
      });
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
