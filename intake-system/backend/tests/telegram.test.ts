import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { MockMondayAdapter } from '../src/adapters/mock-adapters';
import { INITIAL_FORM_DATA, type CreateIntakeRequest } from '../../shared/types';

function buildCreatePayload(overrides: Partial<CreateIntakeRequest> = {}): CreateIntakeRequest {
  return {
    idempotencyKey: overrides.idempotencyKey ?? 'test-idempotency-key',
    flowType: overrides.flowType ?? 'dropoff',
    formData: {
      ...INITIAL_FORM_DATA,
      flowType: overrides.flowType ?? 'dropoff',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '07700111222',
      deviceCategory: 'iPhone',
      model: 'iPhone 15 Pro',
      fault: 'Screen',
      faultDescription: 'Dropped on concrete and now has lines on the display.',
      repairedBefore: false,
      appleSeen: false,
      purchaseCondition: 'new',
      otherIssues: 'No other issues noticed.',
      dataBackedUp: 'yes',
      dataImportance: 'preserve',
      softwareUpdatePermission: 'allow',
      passcode: '1234',
      passcodeAcknowledged: true,
      deliveryPreference: 'collect',
      ...(overrides.formData ?? {}),
    },
  };
}

describe('Telegram intake routes', () => {
  it('renders a Telegram thread from customer-submitted answers and shows missing prompts', async () => {
    const mondayAdapter = new MockMondayAdapter();
    mondayAdapter.seedItem({
      id: 'older-item',
      name: 'John Smith',
      customerEmail: 'john@example.com',
      device: 'iPhone 14 Pro',
      service: 'Battery',
      status: 'Completed',
      bookingDate: '2026-04-01T09:00:00.000Z',
    });

    const app = createApp({ mondayAdapter });

    const createResponse = await request(app)
      .post('/api/intake')
      .send(buildCreatePayload({
        formData: {
          ...INITIAL_FORM_DATA,
          flowType: 'dropoff',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '07700111222',
          deviceCategory: 'iPhone',
          model: 'iPhone 15 Pro',
          fault: 'Screen',
          faultDescription: 'Cracked after a drop.',
          repairedBefore: null,
          appleSeen: null,
          passcodeAcknowledged: true,
        },
      }));

    expect(createResponse.status).toBe(201);

    const syncResponse = await request(app)
      .post(`/api/telegram/intakes/${createResponse.body.sessionId}/sync`)
      .send({ chatId: 'staff-room' });

    expect(syncResponse.status).toBe(200);
    expect(syncResponse.body.renderedText).toContain('What The Customer Told Us');
    expect(syncResponse.body.renderedText).toContain('Issue: Cracked after a drop.');
    expect(syncResponse.body.customerHistory.previousRepairCount).toBe(2);
    expect(syncResponse.body.missingFields.map((field: { id: string }) => field.id)).toContain('repaired_before');
    expect(syncResponse.body.availableActions).toContain('fill_missing_fields');
    expect(syncResponse.body.thread.chatId).toBe('staff-room');
  });

  it('supports Telegram actions to fill gates and complete intake', async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post('/api/intake')
      .send(buildCreatePayload());

    expect(createResponse.status).toBe(201);
    const sessionId = createResponse.body.sessionId;

    const syncResponse = await request(app)
      .post(`/api/telegram/intakes/${sessionId}/sync`)
      .send({ chatId: 'nahid-group' });

    expect(syncResponse.status).toBe(200);

    const passcodeResponse = await request(app)
      .post(`/api/telegram/intakes/${sessionId}/actions/passcode`)
      .send({
        operatorName: 'Nahid',
        passcode: '1234',
        verificationStatus: 'tested',
      });

    expect(passcodeResponse.status).toBe(200);

    const stockResponse = await request(app)
      .post(`/api/telegram/intakes/${sessionId}/actions/stock`)
      .send({
        operatorName: 'Nahid',
      });

    expect(stockResponse.status).toBe(200);
    expect(stockResponse.body.renderedText).toContain('Stock check: in_stock');

    const turnaroundResponse = await request(app)
      .post(`/api/telegram/intakes/${sessionId}/actions/turnaround`)
      .send({
        operatorName: 'Nahid',
        status: 'confirmed',
      });

    expect(turnaroundResponse.status).toBe(200);

    const completeResponse = await request(app)
      .post(`/api/telegram/intakes/${sessionId}/actions/complete`)
      .send({
        operatorName: 'Nahid',
      });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.status).toBe('completed');

    const threadResponse = await request(app).get(`/api/telegram/intakes/${sessionId}`);

    expect(threadResponse.status).toBe(200);
    expect(threadResponse.body.status).toBe('completed');
    expect(threadResponse.body.missingFields).toHaveLength(0);
  });

  it('returns previous notes and model options for Telegram intake actions', async () => {
    const mondayAdapter = new MockMondayAdapter();
    const previousItem = mondayAdapter.seedItem({
      id: 'history-item',
      name: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      device: 'MacBook Pro 14 M3 Pro/Max A2992',
      service: 'Screen',
      status: 'Completed',
      bookingDate: '2026-03-20T10:00:00.000Z',
    });
    await mondayAdapter.createUpdate({
      itemId: previousItem.id,
      operatorName: 'Ricky',
      text: 'Customer mentioned liquid exposure on the previous visit.',
    });

    const app = createApp({ mondayAdapter });

    const createResponse = await request(app)
      .post('/api/intake')
      .send(buildCreatePayload({
        idempotencyKey: 'alice-intake',
        formData: {
          ...INITIAL_FORM_DATA,
          flowType: 'dropoff',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '07700111223',
          deviceCategory: 'MacBook',
          model: 'MacBook Pro 14 M3 Pro/Max A2992',
          fault: 'Screen',
          faultDescription: 'Screen is cracked after travel.',
          repairedBefore: false,
          appleSeen: false,
          purchaseCondition: 'new',
          otherIssues: 'Keyboard feels fine.',
          dataBackedUp: 'yes',
          dataImportance: 'preserve',
          softwareUpdatePermission: 'allow',
          passcode: '1111',
          passcodePassword: 'secret-password',
          passcodeAcknowledged: true,
          deliveryPreference: 'collect',
        },
      }));

    expect(createResponse.status).toBe(201);
    const sessionId = createResponse.body.sessionId;

    const notesResponse = await request(app)
      .get(`/api/telegram/intakes/${sessionId}/actions/previous-notes`);

    expect(notesResponse.status).toBe(200);
    expect(notesResponse.body.notes).toHaveLength(1);
    expect(notesResponse.body.notes[0].text).toContain('liquid exposure');

    const modelsResponse = await request(app)
      .get(`/api/telegram/intakes/${sessionId}/models?q=A2992`);

    expect(modelsResponse.status).toBe(200);
    expect(modelsResponse.body.models).toContain('MacBook Pro 14 M3 Pro/Max A2992');
  });
});
