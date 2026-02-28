import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { envSchema } from './config/env.validation';
import 'dotenv/config';

const config = envSchema.partial().parse(process.env);

export default defineConfig({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  dbName: config.DB_DATABASE,
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  debug: config.NODE_ENV !== 'production',
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  tsNode: process.env.NODE_ENV === 'test',
  extensions: [Migrator],
});
