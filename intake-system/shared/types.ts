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

export interface MondayItem {
  id: string;
  name: string;
  device: string;
  service: string;
  status: string;
  group: { id: string; title: string };
  bookingDate: string | null;
  intercomLink: string | null;
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
  appleSeen: boolean | null;
  dataBackedUp: DataBackupStatus | null;
  passcodeAcknowledged: boolean;
  deliveryPreference: DeliveryPreference | null;
  selectedBooking: MondayItem | null;
  bookingConfirmed: boolean;
  additionalNotes: string;
  collectionQuestions: string;
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
  appleSeen: null,
  dataBackedUp: null,
  passcodeAcknowledged: false,
  deliveryPreference: null,
  selectedBooking: null,
  bookingConfirmed: false,
  additionalNotes: '',
  collectionQuestions: '',
};
