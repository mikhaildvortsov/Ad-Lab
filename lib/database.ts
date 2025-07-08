import { Pool, PoolClient, QueryResult } from 'pg';

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5, // Reduced pool size for Supabase
  idleTimeoutMillis: 60000, // Keep connections open longer
  connectionTimeoutMillis: 10000, // Increased timeout for Supabase
  acquireTimeoutMillis: 10000, // Time to wait for connection from pool
  query_timeout: 30000, // Query timeout
};

// Create a connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required for database connection!');
    }
    
    pool = new Pool(dbConfig);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
      process.exit(-1);
    });
    
    // Log successful connection
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });
  }
  
  return pool;
}

// Generic query function with error handling
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query:', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Transaction wrapper function
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
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close pool connections (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

// Database initialization function
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed during initialization');
    }
    
    console.log('Database initialized successfully');
    
    // Optionally run schema migrations here
    // await runMigrations();
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Export pool for advanced usage if needed
export { getPool }; 