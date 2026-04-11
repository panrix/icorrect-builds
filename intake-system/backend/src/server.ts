import { createApp } from './app';
import { getEnv } from './config/env';

const env = getEnv();
const app = createApp();

app.listen(env.port, () => {
  console.log(`intake backend listening on port ${env.port}`);
});
