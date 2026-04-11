import type { NextFunction, Request, Response } from 'express';
import { GatesFailedError, HttpError, VersionConflictError } from '../lib/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof GatesFailedError) {
    return res.status(error.statusCode).json({
      error: error.message,
      failedGates: error.failedGates,
    });
  }

  if (error instanceof VersionConflictError) {
    return res.status(error.statusCode).json({
      error: error.message,
      currentSession: error.currentSession,
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  console.error(error);
  return res.status(500).json({
    error: 'server error',
  });
}
