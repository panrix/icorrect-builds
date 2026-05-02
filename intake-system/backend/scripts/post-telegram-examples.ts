import request from 'supertest';
import { createApp } from '../src/app';
import { MockMondayAdapter } from '../src/adapters/mock-adapters';
import { INITIAL_FORM_DATA, type MondayItem } from '../../shared/types';

const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? '-1003931760398';
const TOPICS = {
  walkin: process.env.TELEGRAM_RANDOM_WALKINS_THREAD_ID ?? '2',
  appointment: process.env.TELEGRAM_BOOKED_APPOINTMENTS_THREAD_ID ?? '41',
  collection: process.env.TELEGRAM_COLLECTIONS_THREAD_ID ?? '37',
  enquiry: process.env.TELEGRAM_ENQUIRY_THREAD_ID ?? '3',
};

function assertEnv() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is required to post live Telegram examples.');
  }
}

function seededBooking(item: Partial<MondayItem> & Pick<MondayItem, 'id' | 'name' | 'device' | 'service' | 'status' | 'group' | 'bookingDate' | 'intercomLink'>): MondayItem {
  return {
    id: item.id,
    name: item.name,
    device: item.device,
    service: item.service,
    status: item.status,
    group: item.group,
    bookingDate: item.bookingDate,
    intercomLink: item.intercomLink,
  };
}

async function postExamples() {
  assertEnv();

  const mondayAdapter = new MockMondayAdapter();

  const walkInHistory = mondayAdapter.seedItem({
    id: 'history-walkin',
    name: 'Example Walk-In Customer',
    customerEmail: 'walkin@example.icorrect',
    customerPhone: '07700000111',
    device: 'iPhone 14 Pro',
    service: 'Battery',
    status: 'Completed',
    bookingDate: '2026-03-20T11:00:00.000Z',
    intercomLink: 'https://app.intercom.com/example/walkin',
    group: { id: 'history', title: 'History' },
  });
  await mondayAdapter.createUpdate({
    itemId: walkInHistory.id,
    operatorName: 'Ricky',
    text: 'Previous battery repair. Customer was happy and collected same day.',
  });

  const appointmentBooking = mondayAdapter.seedItem({
    id: 'booking-appointment',
    name: 'Example Appointment Customer',
    customerEmail: 'appointment@example.icorrect',
    customerPhone: '07700000222',
    device: 'MacBook Pro 14 M3 Pro/Max A2992',
    service: 'Screen',
    status: 'Booking Confirmed',
    bookingDate: '2026-04-22T10:30:00.000Z',
    intercomLink: 'https://app.intercom.com/example/appointment',
    group: { id: 'new_group34198', title: 'Incoming Future' },
  });
  await mondayAdapter.createUpdate({
    itemId: appointmentBooking.id,
    operatorName: 'Ferrari',
    text: 'Customer already discussed pricing by email. Need to confirm previous repair history and what Apple said before taking it in.',
  });

  const collectionHistory = mondayAdapter.seedItem({
    id: 'history-collection',
    name: 'Example Collection Customer',
    customerEmail: 'collection@example.icorrect',
    customerPhone: '07700000333',
    device: 'iPad Pro 12.9',
    service: 'Charging',
    status: 'Ready To Collect',
    bookingDate: '2026-04-20T16:15:00.000Z',
    intercomLink: 'https://app.intercom.com/example/collection',
    group: { id: 'new_group34086', title: 'Awaiting Collection' },
  });
  await mondayAdapter.createUpdate({
    itemId: collectionHistory.id,
    operatorName: 'Ronny',
    text: 'Charging port replaced and tested. Minor frame wear noted but no post-repair issue outstanding. Device ready for collection.',
  });

  const enquiryHistory = mondayAdapter.seedItem({
    id: 'history-enquiry',
    name: 'Example Enquiry Customer',
    customerEmail: 'enquiry@example.icorrect',
    customerPhone: '07700000444',
    device: 'Apple Watch S8 45mm',
    service: 'Screen',
    status: 'Completed',
    bookingDate: '2026-01-10T09:00:00.000Z',
    intercomLink: 'https://app.intercom.com/example/enquiry',
    group: { id: 'history', title: 'History' },
  });
  await mondayAdapter.createUpdate({
    itemId: enquiryHistory.id,
    operatorName: 'Michael',
    text: 'Previous watch screen repair. Customer asked about turnaround twice and may book in again if the quote works for them.',
  });

  const app = createApp({ mondayAdapter });

  const walkInCreate = await request(app).post('/api/intake').send({
    idempotencyKey: 'telegram-example-walkin',
    flowType: 'dropoff',
    formData: {
      ...INITIAL_FORM_DATA,
      flowType: 'dropoff',
      name: 'Example Walk-In Customer',
      email: 'walkin@example.icorrect',
      phone: '07700000111',
      deviceCategory: 'iPhone',
      model: 'iPhone 15 Pro',
      fault: 'Screen',
      faultDescription: 'Dropped on pavement this morning. Screen is cracked and has green lines.',
      repairedBefore: false,
      appleSeen: false,
      purchaseCondition: 'new',
      otherIssues: 'Battery is also draining faster than normal.',
      dataBackedUp: 'yes',
      dataImportance: 'preserve',
      softwareUpdatePermission: 'allow',
      passcode: '1234',
      passcodeAcknowledged: true,
      deliveryPreference: 'collect',
    },
  });
  const walkInId = walkInCreate.body.sessionId;
  await request(app).post(`/api/telegram/intakes/${walkInId}/sync`).send({
    chatId: CHAT_ID,
    threadId: TOPICS.walkin,
  });
  await request(app).post(`/api/telegram/intakes/${walkInId}/actions/passcode`).send({
    operatorName: 'Nahid',
    passcode: '1234',
    verificationStatus: 'tested',
    notes: 'Unlocked with customer present upstairs.',
  });
  await request(app).post(`/api/telegram/intakes/${walkInId}/actions/stock`).send({
    operatorName: 'Nahid',
  });
  await request(app).post(`/api/telegram/intakes/${walkInId}/actions/turnaround`).send({
    operatorName: 'Nahid',
    status: 'confirmed',
    notes: 'Agreed same-day turnaround if no hidden damage is found.',
  });

  const appointmentCreate = await request(app).post('/api/intake').send({
    idempotencyKey: 'telegram-example-appointment',
    flowType: 'appointment',
    formData: {
      ...INITIAL_FORM_DATA,
      flowType: 'appointment',
      name: 'Example Appointment Customer',
      email: 'appointment@example.icorrect',
      phone: '07700000222',
      deviceCategory: 'MacBook',
      model: 'MacBook Pro 14 M3 Pro/Max A2992',
      fault: 'Screen',
      faultDescription: 'Booked appointment for top-right impact damage and flickering display.',
      repairedBefore: true,
      repairedBeforeDetails: 'Battery replaced by Apple in 2025.',
      appleSeen: true,
      appleSeenDetails: 'Apple quoted full unit replacement and suggested board-level work elsewhere.',
      purchaseCondition: 'new',
      otherIssues: 'No other issues reported.',
      dataBackedUp: 'yes',
      dataImportance: 'preserve',
      softwareUpdatePermission: 'allow',
      passcode: '2468',
      passcodePassword: 'mbp-password',
      passcodeAcknowledged: true,
      deliveryPreference: 'collect',
      selectedBooking: seededBooking(appointmentBooking),
      bookingConfirmed: true,
      additionalNotes: 'Customer has a client meeting tomorrow afternoon.',
    },
  });
  const appointmentId = appointmentCreate.body.sessionId;
  await request(app).post(`/api/telegram/intakes/${appointmentId}/sync`).send({
    chatId: CHAT_ID,
    threadId: TOPICS.appointment,
  });

  const collectionCreate = await request(app).post('/api/intake').send({
    idempotencyKey: 'telegram-example-collection',
    flowType: 'collection',
    formData: {
      ...INITIAL_FORM_DATA,
      flowType: 'collection',
      name: 'Example Collection Customer',
      email: 'collection@example.icorrect',
      phone: '07700000333',
      deviceCategory: 'iPad',
      model: 'iPad Pro 12.9',
      collectionQuestions: 'Can you remind me what was repaired and whether there were any issues noted?',
    },
  });
  const collectionId = collectionCreate.body.sessionId;
  await request(app).post(`/api/telegram/intakes/${collectionId}/sync`).send({
    chatId: CHAT_ID,
    threadId: TOPICS.collection,
  });

  const enquiryCreate = await request(app).post('/api/intake').send({
    idempotencyKey: 'telegram-example-enquiry',
    flowType: 'enquiry',
    formData: {
      ...INITIAL_FORM_DATA,
      flowType: 'enquiry',
      name: 'Example Enquiry Customer',
      email: 'enquiry@example.icorrect',
      phone: '07700000444',
      deviceCategory: 'Apple Watch',
      model: 'Apple Watch S8 45mm',
      fault: 'Screen',
      faultDescription: 'Customer wants to know whether cracked glass can be done same day and what the likely price range is.',
      additionalNotes: 'They are deciding whether to leave it today or book later if the quote and turnaround sound right.',
    },
  });
  const enquiryId = enquiryCreate.body.sessionId;
  await request(app).post(`/api/telegram/intakes/${enquiryId}/sync`).send({
    chatId: CHAT_ID,
    threadId: TOPICS.enquiry,
  });

  console.log(
    JSON.stringify(
      {
        chatId: CHAT_ID,
        topics: TOPICS,
        posted: {
          walkin: walkInId,
          appointment: appointmentId,
          collection: collectionId,
          enquiry: enquiryId,
        },
      },
      null,
      2,
    ),
  );
}

postExamples().catch((error) => {
  console.error(error);
  process.exit(1);
});
