import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'invoice_financer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

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
