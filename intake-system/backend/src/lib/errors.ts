import type { CheckType, IntakeSession } from '../../../shared/types';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class VersionConflictError extends HttpError {
  constructor(public readonly currentSession: IntakeSession) {
    super(409, 'version conflict');
  }
}

export class GatesFailedError extends HttpError {
  constructor(public readonly failedGates: CheckType[]) {
    super(400, 'gates not passed');
  }
}
