import pricingData from '../../../pricing-data.json';
import {
  type CustomerHistorySummary,
  type DataBackupStatus,
  type DataImportance,
  type DeliveryPreference,
  type IntakeSession,
  type PurchaseCondition,
  type SoftwareUpdatePermission,
  type TelegramActionId,
  type TelegramMissingField,
  type TelegramMissingFieldId,
  type TelegramThreadSummary,
} from '../../../shared/types';

const FIELD_METADATA: Record<TelegramMissingFieldId, Omit<TelegramMissingField, 'id'>> = {
  phone: {
    label: 'Phone number',
    prompt: 'Collect the customer phone number before completing intake.',
  },
  model: {
    label: 'Confirmed model',
    prompt: 'Confirm the exact model with the customer.',
  },
  fault_description: {
    label: 'Fault description',
    prompt: 'Capture how the issue happened and what the customer is seeing.',
  },
  repaired_before: {
    label: 'Previous repair history',
    prompt: 'Ask whether this device has been repaired before.',
  },
  repaired_before_details: {
    label: 'Previous repair details',
    prompt: 'Capture what was repaired previously and where.',
  },
  apple_seen: {
    label: 'Apple/service provider history',
    prompt: 'Ask whether Apple or another service provider has seen the device.',
  },
  apple_seen_details: {
    label: 'Apple/service provider notes',
    prompt: 'Capture what Apple or the provider said about the device.',
  },
  purchase_condition: {
    label: 'Purchase condition',
    prompt: 'Ask whether the device was purchased new, refurbished, or second-hand.',
  },
  other_issues: {
    label: 'Other issues',
    prompt: 'Ask whether the customer has noticed any other issues.',
  },
  data_backed_up: {
    label: 'Backup status',
    prompt: 'Ask whether the device data is backed up.',
  },
  data_importance: {
    label: 'Data importance',
    prompt: 'Ask whether preserving the customer data is important.',
  },
  software_update_permission: {
    label: 'Software update permission',
    prompt: 'Ask whether software can be updated if the repair needs it.',
  },
  passcode: {
    label: 'Passcode',
    prompt: 'Collect the device passcode for testing.',
  },
  passcode_password: {
    label: 'MacBook password',
    prompt: 'Collect the device password if the repair is for a MacBook.',
  },
  delivery_preference: {
    label: 'Delivery preference',
    prompt: 'Confirm whether the customer will collect or wants delivery.',
  },
  stock_check: {
    label: 'Stock check',
    prompt: 'Run the stock check before accepting the intake.',
  },
  turnaround_confirmation: {
    label: 'Turnaround confirmation',
    prompt: 'Confirm the agreed turnaround with the customer.',
  },
  passcode_verification: {
    label: 'Passcode verification',
    prompt: 'Verify whether the passcode was tested, recorded, or still missing.',
  },
};

interface EffectiveIntakeValues {
  phone: string;
  model: string;
  faultDescription: string;
  repairedBefore: boolean | null;
  repairedBeforeDetails: string;
  appleSeen: boolean | null;
  appleSeenDetails: string;
  purchaseCondition: PurchaseCondition | null;
  otherIssues: string;
  dataBackedUp: DataBackupStatus | null;
  dataImportance: DataImportance | null;
  softwareUpdatePermission: SoftwareUpdatePermission | null;
  passcode: string;
  passcodePassword: string;
  deliveryPreference: DeliveryPreference | null;
  stockChecked: boolean;
  turnaroundConfirmed: boolean;
  passcodeVerified: boolean;
}

function getEffectiveValues(session: IntakeSession): EffectiveIntakeValues {
  const operatorData = session.operatorData;
  const formData = session.formData;

  return {
    phone: session.customerPhone ?? '',
    model: operatorData.confirmedModel || formData.model,
    faultDescription: formData.faultDescription,
    repairedBefore: operatorData.repairedBefore ?? formData.repairedBefore,
    repairedBeforeDetails: operatorData.repairedBeforeDetails || formData.repairedBeforeDetails,
    appleSeen: operatorData.appleSeen ?? formData.appleSeen,
    appleSeenDetails: operatorData.appleSeenDetails || formData.appleSeenDetails,
    purchaseCondition: operatorData.purchaseCondition ?? formData.purchaseCondition,
    otherIssues: operatorData.otherIssues || formData.otherIssues,
    dataBackedUp: operatorData.dataBackedUp ?? formData.dataBackedUp,
    dataImportance: operatorData.dataImportance ?? formData.dataImportance,
    softwareUpdatePermission:
      operatorData.softwareUpdatePermission ?? formData.softwareUpdatePermission,
    passcode: operatorData.passcode || formData.passcode,
    passcodePassword: operatorData.passcodePassword || formData.passcodePassword,
    deliveryPreference: operatorData.deliveryPreference ?? formData.deliveryPreference,
    stockChecked: operatorData.stockCheck !== null,
    turnaroundConfirmed: operatorData.turnaroundConfirmationStatus !== null,
    passcodeVerified: operatorData.passcodeVerificationStatus !== null,
  };
}

function getRequiredFields(session: IntakeSession): TelegramMissingFieldId[] {
  const base: TelegramMissingFieldId[] = [];

  if (!session.customerPhone && session.flowType !== 'appointment') {
    base.push('phone');
  }

  if (session.flowType === 'collection') {
    return base;
  }

  base.push(
    'model',
    'fault_description',
    'repaired_before',
    'apple_seen',
    'purchase_condition',
    'other_issues',
    'data_backed_up',
    'data_importance',
    'software_update_permission',
    'passcode',
    'delivery_preference',
    'passcode_verification',
  );

  if (session.formData.deviceCategory === 'MacBook') {
    base.push('passcode_password');
  }

  if (session.flowType === 'dropoff' || session.flowType === 'appointment') {
    base.push('stock_check', 'turnaround_confirmation');
  }

  if (session.flowType === 'enquiry') {
    return ['model', 'fault_description'];
  }

  if (session.formData.fault === 'Diagnostic') {
    base.push('repaired_before_details', 'apple_seen_details');
  } else {
    base.push('repaired_before_details');
  }

  return Array.from(new Set(base));
}

export function getMissingFields(session: IntakeSession): TelegramMissingField[] {
  const values = getEffectiveValues(session);

  return getRequiredFields(session)
    .filter((field) => {
      switch (field) {
        case 'phone':
          return !values.phone.trim();
        case 'model':
          return !values.model.trim();
        case 'fault_description':
          return !values.faultDescription.trim();
        case 'repaired_before':
          return values.repairedBefore === null;
        case 'repaired_before_details':
          return values.repairedBefore === true && !values.repairedBeforeDetails.trim();
        case 'apple_seen':
          return values.appleSeen === null;
        case 'apple_seen_details':
          return values.appleSeen === true && !values.appleSeenDetails.trim();
        case 'purchase_condition':
          return values.purchaseCondition === null;
        case 'other_issues':
          return !values.otherIssues.trim();
        case 'data_backed_up':
          return values.dataBackedUp === null;
        case 'data_importance':
          return values.dataImportance === null;
        case 'software_update_permission':
          return values.softwareUpdatePermission === null;
        case 'passcode':
          return !values.passcode.trim();
        case 'passcode_password':
          return session.formData.deviceCategory === 'MacBook' && !values.passcodePassword.trim();
        case 'delivery_preference':
          return values.deliveryPreference === null;
        case 'stock_check':
          return !values.stockChecked;
        case 'turnaround_confirmation':
          return !values.turnaroundConfirmed;
        case 'passcode_verification':
          return !values.passcodeVerified;
      }
    })
    .map((field) => ({
      id: field,
      ...FIELD_METADATA[field],
    }));
}

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return 'Missing';
  }
  return value ? 'Yes' : 'No';
}

function formatPurchaseCondition(value: PurchaseCondition | null): string {
  switch (value) {
    case 'new':
      return 'New';
    case 'refurbished':
      return 'Refurbished';
    case 'second_hand':
      return 'Second-hand';
    case 'unknown':
      return "I'm not sure";
    default:
      return 'Missing';
  }
}

function formatBackup(value: DataBackupStatus | null): string {
  switch (value) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'unknown':
      return "I don't know";
    default:
      return 'Missing';
  }
}

function formatDataImportance(value: DataImportance | null): string {
  switch (value) {
    case 'preserve':
      return 'Preserve data';
    case 'not_important':
      return 'Data not important';
    default:
      return 'Missing';
  }
}

function formatSoftwareUpdate(value: SoftwareUpdatePermission | null): string {
  switch (value) {
    case 'allow':
      return 'Allowed';
    case 'deny':
      return 'Do not update';
    default:
      return 'Missing';
  }
}

function formatDelivery(value: DeliveryPreference | null): string {
  switch (value) {
    case 'deliver':
      return 'Deliver back';
    case 'collect':
      return 'Collect';
    default:
      return 'Missing';
  }
}

function buildCustomerAnswers(session: IntakeSession, values: EffectiveIntakeValues): string[] {
  return [
    `Device: ${values.model || session.formData.deviceCategory || 'Missing model'}`,
    `Fault: ${session.formData.fault ?? 'Missing fault'}`,
    `Issue: ${values.faultDescription || 'Missing'}`,
    `Repaired before: ${formatBoolean(values.repairedBefore)}`,
    `Previous repair detail: ${values.repairedBeforeDetails || 'Missing'}`,
    `Apple/provider seen it: ${formatBoolean(values.appleSeen)}`,
    `Apple/provider notes: ${values.appleSeenDetails || 'Missing'}`,
    `Purchase condition: ${formatPurchaseCondition(values.purchaseCondition)}`,
    `Other issues: ${values.otherIssues || 'Missing'}`,
    `Backup: ${formatBackup(values.dataBackedUp)}`,
    `Data importance: ${formatDataImportance(values.dataImportance)}`,
    `Software update: ${formatSoftwareUpdate(values.softwareUpdatePermission)}`,
    `Delivery: ${formatDelivery(values.deliveryPreference)}`,
    `Passcode: ${values.passcode ? 'Captured' : 'Missing'}`,
    session.formData.deviceCategory === 'MacBook'
      ? `Password: ${values.passcodePassword ? 'Captured' : 'Missing'}`
      : '',
  ].filter(Boolean);
}

function buildHistoryLines(history: CustomerHistorySummary): string[] {
  if (!history.isReturningCustomer) {
    return ['No previous repair history found.'];
  }

  return history.repairs.map((repair) => {
    const date = repair.date ? repair.date.slice(0, 10) : 'Unknown date';
    return `${date} · ${repair.device} · ${repair.service} · ${repair.status}`;
  });
}

function buildSection(title: string, lines: string[]): string[] {
  return [title, ...lines, ''];
}

function buildCustomerHeader(session: IntakeSession, values: EffectiveIntakeValues): string[] {
  return [
    'Customer',
    `Name: ${session.customerName}`,
    `Email: ${session.customerEmail}`,
    `Phone: ${values.phone || 'Missing'}`,
  ];
}

function buildDropoffBody(session: IntakeSession, history: CustomerHistorySummary, values: EffectiveIntakeValues, missingFields: TelegramMissingField[]): string[] {
  return [
    `${session.customerName} · WALK-IN REPAIR · ${session.status.toUpperCase()}`,
    `${values.model || session.formData.deviceCategory || 'Unknown device'} · ${session.formData.fault ?? 'Unknown fault'}`,
    '',
    ...buildSection('Customer Profile', [
      history.isReturningCustomer
        ? `${history.previousRepairCount} previous repair${history.previousRepairCount === 1 ? '' : 's'}`
        : 'First time with us',
      ...buildCustomerHeader(session, values).slice(1),
    ]),
    ...buildSection('What The Customer Told Us', buildCustomerAnswers(session, values)),
    ...buildSection('Customer History', buildHistoryLines(history)),
    ...buildSection('Intake Checks', [
      `Passcode verification: ${session.operatorData.passcodeVerificationStatus ?? 'Missing'}`,
      `Stock check: ${session.operatorData.stockCheck?.status ?? 'Missing'}`,
      `Turnaround: ${session.operatorData.turnaroundConfirmationStatus ?? 'Missing'}`,
    ]),
    missingFields.length > 0
      ? `Missing: ${missingFields.map((field) => field.label).join(', ')}`
      : 'Missing: none',
  ];
}

function buildAppointmentBody(session: IntakeSession, history: CustomerHistorySummary, values: EffectiveIntakeValues, missingFields: TelegramMissingField[]): string[] {
  const booking = session.formData.selectedBooking;
  const lines = [
    `${session.customerName} · BOOKED APPOINTMENT · ${session.status.toUpperCase()}`,
    `${booking?.device || values.model || session.formData.deviceCategory || 'Unknown device'} · ${booking?.service || session.formData.fault || 'Unknown service'}`,
    '',
    ...buildSection('Booking On File', [
      `Booking status: ${booking?.status || 'Matched manually'}`,
      `Booking date: ${booking?.bookingDate?.slice(0, 16).replace('T', ' ') || 'Missing'}`,
      `On-file device: ${booking?.device || 'Missing'}`,
      `On-file service: ${booking?.service || 'Missing'}`,
      `Customer confirmed booking: ${session.formData.bookingConfirmed ? 'Yes' : 'Needs confirmation'}`,
    ]),
    ...buildSection('Customer Profile', [
      history.isReturningCustomer
        ? `${history.previousRepairCount} previous repair${history.previousRepairCount === 1 ? '' : 's'}`
        : 'First time with us',
      ...buildCustomerHeader(session, values).slice(1),
    ]),
    ...buildSection('Pre-Repair On File / Confirmed', buildCustomerAnswers(session, values)),
    ...buildSection('What Needs Confirming In Person', [
      `Repaired before: ${formatBoolean(values.repairedBefore)}`,
      `Apple/provider seen it: ${formatBoolean(values.appleSeen)}`,
      `Any missing pre-repair detail: ${
        missingFields.length > 0
          ? missingFields.map((field) => field.label).join(', ')
          : 'Nothing missing'
      }`,
    ]),
    ...buildSection('Missing Before Intake Complete', [
      missingFields.length > 0
        ? missingFields.map((field) => field.label).join(', ')
        : 'Nothing missing',
    ]),
  ];

  if (session.formData.additionalNotes.trim()) {
    lines.push(
      ...buildSection('Additional Notes From Customer', [session.formData.additionalNotes.trim()]),
    );
  }

  return lines;
}

function buildCollectionBody(session: IntakeSession, history: CustomerHistorySummary, values: EffectiveIntakeValues): string[] {
  const latestRepair = history.repairs[0] ?? null;
  return [
    `${session.customerName} · COLLECTION · ${session.status.toUpperCase()}`,
    `${latestRepair?.device || values.model || session.formData.deviceCategory || 'Unknown device'} collection`,
    '',
    ...buildSection('Collection Request', [
      ...buildCustomerHeader(session, values).slice(1),
      `Device: ${session.formData.deviceCategory || 'Missing'}`,
      `Question from customer: ${session.formData.collectionQuestions.trim() || 'No question submitted'}`,
    ]),
    ...buildSection('Repair Ready For Collection', [
      `Original intake date: ${latestRepair?.date?.slice(0, 10) || 'Missing'}`,
      `Repair / service completed: ${latestRepair?.service || 'Missing'}`,
      `Current job status: ${latestRepair?.status || 'Missing'}`,
      `Last repair update: ${latestRepair?.lastUpdatedAt?.slice(0, 10) || 'Missing'}`,
      `Known issue / final note: ${latestRepair?.lastNote || 'No issue note on file'}`,
    ]),
    ...buildSection('Relevant History', buildHistoryLines(history)),
    ...buildSection('Operator Focus', [
      'Confirm the right person and the right device.',
      'Check the device is actually ready before retrieving it.',
      'Be ready to explain what was repaired and whether any issue was flagged.',
      'Answer any collection/warranty question.',
      'Mark as collected when complete.',
    ]),
  ];
}

function buildEnquiryBody(session: IntakeSession, history: CustomerHistorySummary, values: EffectiveIntakeValues, missingFields: TelegramMissingField[]): string[] {
  return [
    `${session.customerName} · ENQUIRY · ${session.status.toUpperCase()}`,
    `${session.formData.deviceCategory || 'Unknown device'} · ${session.formData.fault || 'General question'}`,
    '',
    ...buildSection('Enquiry Summary', [
      ...buildCustomerHeader(session, values).slice(1),
      `Device: ${session.formData.deviceCategory || 'Missing'}`,
      `Fault/topic: ${session.formData.fault || 'Missing'}`,
      `What they want help with: ${values.faultDescription || 'Missing'}`,
    ]),
    ...buildSection('Customer History', buildHistoryLines(history)),
    ...buildSection('Conversion Opportunity', [
      'Confirm the details they gave upstairs.',
      'Answer the enquiry clearly and try to move them toward booking in.',
      'If they want to proceed, capture anything else needed to turn this into intake.',
    ]),
    ...buildSection('Operator Focus', [
      'Answer the question or gather the missing detail.',
      'Add notes if the conversation matters later.',
      'If they want to book in, convert this into the repair intake flow.',
    ]),
    missingFields.length > 0
      ? `Still helpful to clarify: ${missingFields.map((field) => field.label).join(', ')}`
      : 'Enough information to speak to the customer',
  ];
}

export function getAvailableActions(
  session: IntakeSession,
  missingFields: TelegramMissingField[],
): TelegramActionId[] {
  const actions: TelegramActionId[] = ['write_notes'];

  if (session.flowType !== 'dropoff') {
    actions.push('view_previous_notes');
  }

  if (session.flowType === 'dropoff' || session.flowType === 'appointment') {
    actions.push('change_model');
  }

  const missingIds = new Set(missingFields.map((field) => field.id));

  if (session.flowType === 'dropoff' || session.flowType === 'appointment') {
    if (
      missingIds.has('stock_check')
      || missingIds.has('turnaround_confirmation')
      || missingIds.has('passcode')
      || missingIds.has('passcode_password')
      || missingIds.has('passcode_verification')
    ) {
      actions.push('check_stock', 'take_passcode');
    }
  }

  if (missingFields.length > 0) {
    actions.push('fill_missing_fields');
  } else {
    actions.push('complete_intake');
  }

  return Array.from(new Set(actions));
}

export function buildTelegramThreadSummary(
  session: IntakeSession,
  history: CustomerHistorySummary,
): TelegramThreadSummary {
  const values = getEffectiveValues(session);
  const missingFields = getMissingFields(session);
  const renderedText = (() => {
    switch (session.flowType) {
      case 'appointment':
        return buildAppointmentBody(session, history, values, missingFields).join('\n');
      case 'collection':
        return buildCollectionBody(session, history, values).join('\n');
      case 'enquiry':
        return buildEnquiryBody(session, history, values, missingFields).join('\n');
      case 'dropoff':
      default:
        return buildDropoffBody(session, history, values, missingFields).join('\n');
    }
  })();

  return {
    intakeId: session.id,
    status: session.status,
    renderedText,
    availableActions: getAvailableActions(session, missingFields),
    missingFields,
    thread: session.telegramThread,
    customerHistory: history,
  };
}

type PricingDataShape = Partial<Record<string, Record<string, Record<string, { price: number }>>>>;

const typedPricingData = pricingData as PricingDataShape;

export function getModelOptions(deviceCategory: string | null, query: string): string[] {
  const catalog = deviceCategory ? typedPricingData[deviceCategory] : undefined;
  if (!catalog) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  return Object.keys(catalog)
    .filter((model) => (normalizedQuery ? model.toLowerCase().includes(normalizedQuery) : true))
    .slice(0, 20);
}
