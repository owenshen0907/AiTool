// lib/db/client.ts
import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
config({ path: '.env.local' });

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});