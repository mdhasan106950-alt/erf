import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    global._postgresPool.on('error', (err) => {
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : String(err || '');
      if (
        msg.includes('Connection terminated') ||
        code === 'ECONNRESET' ||
        code === '57P01' ||
        code === '57P02' ||
        code === '57P03'
      ) {
        console.warn('Idle SQL pool client disconnected; pool will open a fresh client on demand.');
        return;
      }
      console.error('SQL pool client error:', msg || 'unknown');
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
