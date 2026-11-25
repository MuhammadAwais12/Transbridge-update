/**
 * TypeORM DataSource for the migration CLI (yarn migration:generate / run / revert).
 * The running app is configured separately in app.module.ts (same DB_* variables).
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export default new DataSource({
  type: 'postgres',
  host: requireEnv('DB_HOST'),
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // the schema is changed by migrations only
});
