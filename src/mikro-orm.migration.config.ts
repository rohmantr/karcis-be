import baseConfig from './mikro-orm.config';
import { envSchema } from './config/env.validation';
import 'dotenv/config';

const config = envSchema.partial().parse(process.env);

export default {
  ...baseConfig,
  clientUrl: config.DIRECT_URL,
};
