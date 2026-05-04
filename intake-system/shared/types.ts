export type FlowType = 'appointment' | 'dropoff' | 'collection' | 'enquiry';

export type IntakeStatus =
  | 'submitted'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'cancelled';

export type CheckType =
  | 'passcode_verified'
  | 'parts_available'
  | 'turnaround_confirmed'
  | 'fields_complete';

export type DeviceCategory = 'iPhone' | 'iPad' | 'MacBook' | 'Apple Watch';

export type FaultCategory =
  | 'Screen'
  | 'Battery'
  | 'Charging'
  | 'Keyboard'
  | 'Liquid Damage'
  | 'Not Turning On'
  | 'Diagnostic'
  | 'Other';

export type DataBackupStatus = 'yes' | 'no' | 'unknown';
export type DeliveryPreference = 'deliver' | 'collect';
export type MondaySyncStatus = 'pending' | 'synced' | 'failed';
export type PurchaseCondition = 'new' | 'refurbished' | 'second_hand' | 'unknown';
export type DataImportance = 'preserve' | 'not_important';
export type SoftwareUpdatePermission = 'allow' | 'deny';
export type PasscodeVerificationStatus = 'tested' | 'recorded' | 'later' | 'untestable';
export type StockCheckStatus = 'in_stock' | 'order_required' | 'manual_review';
export type TurnaroundConfirmationStatus = 'confirmed' | 'custom';
export type TelegramActionId =
  | 'check_stock'
  | 'take_passcode'
  | 'write_notes'
  | 'view_previous_notes'
  | 'change_model'
  | 'complete_intake'
  | 'fill_missing_fields';
export type TelegramMissingFieldId =
  | 'phone'
  | 'model'
  | 'fault_description'
  | 'repaired_before'
  | 'repaired_before_details'
  | 'apple_seen'
  | 'apple_seen_details'
  | 'purchase_condition'
  | 'other_issues'
  | 'data_backed_up'
  | 'data_importance'
  | 'software_update_permission'
  | 'passcode'
  | 'passcode_password'
  | 'delivery_preference'
  | 'stock_check'
  | 'turnaround_confirmation'
  | 'passcode_verification';

export interface MondayItem {
  id: string;
  name: string;
  device: string;
  service: string;
  status: string;
  group: { id: string; title: string };
  bookingDate: string | null;
  intercomLink: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  lastUpdateAt?: string | null;
}

export interface CustomerHistoryRepair {
  itemId: string;
  device: string;
  service: string;
  status: string;
  date: string | null;
  lastUpdatedAt: string | null;
  lastNote: string | null;
}

export interface CustomerHistorySummary {
  isReturningCustomer: boolean;
  previousRepairCount: number;
  repairs: CustomerHistoryRepair[];
  intercomLink: string | null;
}

export interface HistoricalNote {
  id: string;
  itemId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface StockCheckResult {
  status: StockCheckStatus;
  partLabel: string | null;
  quantity: number | null;
  eta: string | null;
  notes: string | null;
}

export interface IntakeFormData {
  flowType: FlowType | null;
  name: string;
  email: string;
  phone: string;
  deviceCategory: DeviceCategory | null;
  model: string;
  fault: FaultCategory | null;
  faultDescription: string;
  seenPricing: boolean | null;
  proceedWithBooking: boolean | null;
  declineReason: string;
  wantsQuoteEmailed: boolean | null;
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
  passcodeAcknowledged: boolean;
  deliveryPreference: DeliveryPreference | null;
  selectedBooking: MondayItem | null;
  bookingConfirmed: boolean;
  additionalNotes: string;
  collectionQuestions: string;
}

export interface TelegramOperatorData {
  confirmedModel: string;
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
  passcodeVerificationStatus: PasscodeVerificationStatus | null;
  passcodeVerificationNotes: string;
  deliveryPreference: DeliveryPreference | null;
  stockCheck: StockCheckResult | null;
  turnaroundConfirmationStatus: TurnaroundConfirmationStatus | null;
  turnaroundConfirmationNotes: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
}

export interface TelegramThreadState {
  chatId: string | null;
  threadId: string | null;
  messageId: string | null;
  syncedAt: string | null;
  lastRenderedText: string | null;
}

export interface IntakeCheck {
  id: string;
  checkType: CheckType;
  passed: boolean;
  operatorName: string;
  notes: string | null;
  createdAt: string;
}

export interface IntakeSession {
  id: string;
  idempotencyKey: string;
  flowType: FlowType;
  status: IntakeStatus;
  version: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  formData: IntakeFormData;
  operatorData: TelegramOperatorData;
  telegramThread: TelegramThreadState;
  mondayItemId: string | null;
  mondaySyncStatus: MondaySyncStatus;
  claimedBy: string | null;
  claimedAt: string | null;
  checks: IntakeCheck[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntakeRequest {
  idempotencyKey: string;
  flowType: FlowType;
  formData: IntakeFormData;
}

export interface CreateIntakeResponse {
  sessionId: string;
  mondayItemId: string | null;
  mondaySyncStatus: Extract<MondaySyncStatus, 'synced' | 'failed'>;
  status: IntakeStatus;
}

export interface CustomerLookupResponse {
  found: boolean;
  mondayItems: MondayItem[];
  isReturningCustomer: boolean;
  previousRepairCount: number;
  intercomLink: string | null;
}

export interface TodayIntakesResponse {
  sessions: IntakeSession[];
}

export interface TelegramMissingField {
  id: TelegramMissingFieldId;
  label: string;
  prompt: string;
}

export interface TelegramThreadSummary {
  intakeId: string;
  status: IntakeStatus;
  renderedText: string;
  availableActions: TelegramActionId[];
  missingFields: TelegramMissingField[];
  thread: TelegramThreadState;
  customerHistory: CustomerHistorySummary;
}

export interface UpdateIntakeRequest {
  version: number;
  status?: IntakeStatus;
  claimedBy?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  formData?: Partial<IntakeFormData>;
}

export interface AddNotesRequest {
  operatorName: string;
  text: string;
}

export interface AddNotesResponse {
  mondayUpdateId: string;
}

export interface CompleteIntakeRequest {
  version: number;
  operatorName: string;
}

export interface DeclineIntakeRequest {
  version: number;
  operatorName: string;
  reason: string;
}

export interface RecordCheckRequest {
  checkType: CheckType;
  passed: boolean;
  operatorName: string;
  notes?: string;
}

export interface TelegramSyncRequest {
  chatId: string;
  threadId?: string;
  messageId?: string;
}

export interface TelegramFieldCaptureRequest {
  operatorName: string;
  field: TelegramMissingFieldId;
  value: string | boolean;
}

export interface TelegramPasscodeRequest {
  operatorName: string;
  passcode: string;
  password?: string;
  verificationStatus: PasscodeVerificationStatus;
  notes?: string;
}

export interface TelegramStockCheckRequest {
  operatorName: string;
  notes?: string;
}

export interface TelegramTurnaroundRequest {
  operatorName: string;
  status: TurnaroundConfirmationStatus;
  notes?: string;
}

export interface TelegramModelChangeRequest {
  operatorName: string;
  model: string;
}

export interface TelegramNotesRequest {
  operatorName: string;
  text: string;
}

export interface TelegramPreviousNotesResponse {
  notes: HistoricalNote[];
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  version: string;
}

export const FLOW_LABELS: Record<FlowType, string> = {
  appointment: 'Appointment',
  dropoff: 'Drop-Off',
  collection: 'Collection',
  enquiry: 'Enquiry',
};

export const DEVICE_OPTIONS: DeviceCategory[] = ['iPhone', 'iPad', 'MacBook', 'Apple Watch'];
export const FAULT_OPTIONS: FaultCategory[] = [
  'Screen',
  'Battery',
  'Charging',
  'Keyboard',
  'Liquid Damage',
  'Not Turning On',
  'Diagnostic',
  'Other',
];

export const CHECK_TYPES: CheckType[] = [
  'passcode_verified',
  'parts_available',
  'turnaround_confirmed',
  'fields_complete',
];

export const INITIAL_FORM_DATA: IntakeFormData = {
  flowType: null,
  name: '',
  email: '',
  phone: '',
  deviceCategory: null,
  model: '',
  fault: null,
  faultDescription: '',
  seenPricing: null,
  proceedWithBooking: null,
  declineReason: '',
  wantsQuoteEmailed: null,
  repairedBefore: null,
  repairedBeforeDetails: '',
  appleSeen: null,
  appleSeenDetails: '',
  purchaseCondition: null,
  otherIssues: '',
  dataBackedUp: null,
  dataImportance: null,
  softwareUpdatePermission: null,
  passcode: '',
  passcodePassword: '',
  passcodeAcknowledged: false,
  deliveryPreference: null,
  selectedBooking: null,
  bookingConfirmed: false,
  additionalNotes: '',
  collectionQuestions: '',
};

export const INITIAL_TELEGRAM_OPERATOR_DATA: TelegramOperatorData = {
  confirmedModel: '',
  repairedBefore: null,
  repairedBeforeDetails: '',
  appleSeen: null,
  appleSeenDetails: '',
  purchaseCondition: null,
  otherIssues: '',
  dataBackedUp: null,
  dataImportance: null,
  softwareUpdatePermission: null,
  passcode: '',
  passcodePassword: '',
  passcodeVerificationStatus: null,
  passcodeVerificationNotes: '',
  deliveryPreference: null,
  stockCheck: null,
  turnaroundConfirmationStatus: null,
  turnaroundConfirmationNotes: '',
  acceptedAt: null,
  acceptedBy: null,
};

export const INITIAL_TELEGRAM_THREAD_STATE: TelegramThreadState = {
  chatId: null,
  threadId: null,
  messageId: null,
  syncedAt: null,
  lastRenderedText: null,
};
