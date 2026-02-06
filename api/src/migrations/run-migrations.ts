import 'dotenv/config';
import { runMigrations } from './runner';
import pool from '../config/database';

async function main() {
    try {
        await runMigrations();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
