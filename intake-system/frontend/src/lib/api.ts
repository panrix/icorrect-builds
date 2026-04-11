import type {
  CreateIntakeRequest,
  CreateIntakeResponse,
  CustomerLookupResponse,
  HealthResponse,
} from '../../../shared/types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const;

export async function pingHealth(baseUrl = '/api'): Promise<HealthResponse> {
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return (await response.json()) as HealthResponse;
}

export async function createIntake(payload: CreateIntakeRequest, baseUrl = '/api') {
  const response = await fetch(`${baseUrl}/intake`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Create intake failed: ${response.status}`);
  }

  return (await response.json()) as CreateIntakeResponse;
}

export async function lookupCustomer(email: string, baseUrl = '/api') {
  const response = await fetch(`${baseUrl}/customer/lookup?email=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error(`Lookup failed: ${response.status}`);
  }
  return (await response.json()) as CustomerLookupResponse;
}
