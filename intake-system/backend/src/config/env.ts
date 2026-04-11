import 'dotenv/config';

export interface BackendEnv {
  nodeEnv: string;
  port: number;
  mondayAppToken: string;
  intercomAccessToken: string;
  openAiApiKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export function getEnv(): BackendEnv {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? '8016'),
    mondayAppToken: process.env.MONDAY_APP_TOKEN ?? '',
    intercomAccessToken: process.env.INTERCOM_ACCESS_TOKEN ?? '',
    openAiApiKey: process.env.OPENAI_API_KEY ?? '',
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  };
}
