import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
function createDbConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname.includes('neon.tech')) {
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      query_timeout: 30000,
    };
  }
  return {
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    max: 5,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 10000,
    query_timeout: 30000,
  };
}
let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required for database connection!');
    }
    const dbConfig = createDbConfig();
    pool = new Pool(dbConfig);
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
      process.exit(-1);
    });
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });
  }
  return pool;
}
export async function query<T extends QueryResultRow = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  try {
    const result = await pool.query<T>(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', { text, params, error: (error as Error).message });
    throw error;
  }
}
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
export async function initializeDatabase(): Promise<void> {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`Found ${result.rows.length} tables in database`);
    if (result.rows.length === 0) {
      console.log('No tables found. Database may need initialization.');
    }
  } catch (error) {
    console.error('Error checking database state:', error);
    throw error;
  }
}
