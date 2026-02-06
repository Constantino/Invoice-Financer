import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pool from '../config/database';

interface Migration {
    filename: string;
    number: number;
    sql: string;
}

/**
 * Get all migration files sorted by number
 */
export async function getMigrations(): Promise<Migration[]> {
    const migrationsDir = join(__dirname);
    const files = readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
        const match = file.match(/^(\d+)_(.+)\.sql$/);
        if (match) {
            const number = parseInt(match[1], 10);
            const sql = readFileSync(join(migrationsDir, file), 'utf-8');
            migrations.push({ filename: file, number, sql });
        }
    }

    return migrations.sort((a, b) => a.number - b.number);
}

/**
 * Check if a migration has been run
 */
export async function isMigrationRun(migrationNumber: number): Promise<boolean> {
    const client = await pool.connect();
    try {
        // Ensure migrations table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const result = await client.query(
            'SELECT version FROM schema_migrations WHERE version = $1',
            [migrationNumber]
        );
        return result.rows.length > 0;
    } finally {
        client.release();
    }
}

/**
 * Mark a migration as run
 */
export async function markMigrationRun(migrationNumber: number): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
            [migrationNumber]
        );
    } finally {
        client.release();
    }
}

/**
 * Run a single migration
 */
export async function runMigration(migration: Migration): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await markMigrationRun(migration.number);
        await client.query('COMMIT');
        console.log(`✓ Migration ${migration.number}: ${migration.filename}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Migration ${migration.number}: ${migration.filename} failed`);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
    console.log('Starting migrations...');
    const migrations = await getMigrations();

    for (const migration of migrations) {
        const isRun = await isMigrationRun(migration.number);
        if (!isRun) {
            await runMigration(migration);
        } else {
            console.log(`⊘ Migration ${migration.number}: ${migration.filename} (already applied)`);
        }
    }

    console.log('Migrations complete!');
}
