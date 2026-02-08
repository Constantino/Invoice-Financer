import { Pool } from 'pg';

const connectionString = process.env.DATABASE_CONNECTION_STRING;

// Create a connection pool: use Supabase/connection string when set, else DB_* vars
export const pool = new Pool(
    connectionString
        ? { connectionString }
        : {
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432', 10),
              database: process.env.DB_NAME || 'invoice_financer',
              user: process.env.DB_USER || 'postgres',
              password: process.env.DB_PASSWORD || '',
          }
);

// Test database connection
export const testConnection = async (): Promise<void> => {
    try {
        const client = await pool.connect();
        console.log('Database connection successful');
        client.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

export default pool;
