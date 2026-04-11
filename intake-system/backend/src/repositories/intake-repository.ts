import { randomUUID } from 'node:crypto';
import type { IntakeCheck, IntakeSession } from '../../../shared/types';
import { NotFoundError } from '../lib/errors';
import { getLondonDateKey } from '../lib/time';

export interface IntakeRepository {
  findByIdempotencyKey(idempotencyKey: string): Promise<IntakeSession | null>;
  create(session: IntakeSession): Promise<IntakeSession>;
  getById(id: string): Promise<IntakeSession | null>;
  listToday(): Promise<IntakeSession[]>;
  update(session: IntakeSession): Promise<IntakeSession>;
  addCheck(
    sessionId: string,
    input: Omit<IntakeCheck, 'id' | 'createdAt'>,
  ): Promise<IntakeCheck>;
  listChecks(sessionId: string): Promise<IntakeCheck[]>;
}

export class InMemoryIntakeRepository implements IntakeRepository {
  private readonly sessions = new Map<string, IntakeSession>();
  private readonly idempotencyIndex = new Map<string, string>();
  private readonly checks = new Map<string, IntakeCheck[]>();

  async findByIdempotencyKey(idempotencyKey: string): Promise<IntakeSession | null> {
    const sessionId = this.idempotencyIndex.get(idempotencyKey);
    return sessionId ? this.sessions.get(sessionId) ?? null : null;
  }

  async create(session: IntakeSession): Promise<IntakeSession> {
    this.sessions.set(session.id, structuredClone(session));
    this.idempotencyIndex.set(session.idempotencyKey, session.id);
    this.checks.set(session.id, []);
    return structuredClone(session);
  }

  async getById(id: string): Promise<IntakeSession | null> {
    const session = this.sessions.get(id);
    if (!session) {
      return null;
    }

    return {
      ...structuredClone(session),
      checks: await this.listChecks(id),
    };
  }

  async listToday(): Promise<IntakeSession[]> {
    const todayKey = getLondonDateKey(new Date());

    return Array.from(this.sessions.values())
      .filter((session) => getLondonDateKey(session.createdAt) === todayKey)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((session) => structuredClone(session))
      .map(async (session) => ({
        ...session,
        checks: await this.listChecks(session.id),
      }))
      .reduce(async (promise, nextPromise) => {
        const list = await promise;
        list.push(await nextPromise);
        return list;
      }, Promise.resolve([] as IntakeSession[]));
  }

  async update(session: IntakeSession): Promise<IntakeSession> {
    if (!this.sessions.has(session.id)) {
      throw new NotFoundError('session not found');
    }

    this.sessions.set(session.id, structuredClone(session));
    return {
      ...structuredClone(session),
      checks: await this.listChecks(session.id),
    };
  }

  async addCheck(
    sessionId: string,
    input: Omit<IntakeCheck, 'id' | 'createdAt'>,
  ): Promise<IntakeCheck> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError('session not found');
    }

    const check: IntakeCheck = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };

    const existing = this.checks.get(sessionId) ?? [];
    existing.push(check);
    this.checks.set(sessionId, existing);

    return structuredClone(check);
  }

  async listChecks(sessionId: string): Promise<IntakeCheck[]> {
    return structuredClone(this.checks.get(sessionId) ?? []);
  }
}
