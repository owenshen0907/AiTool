// lib/db/client.ts
import pkg from 'pg';
const { Pool } = pkg;

import { config } from 'dotenv';
config({ path: '.env.local' });

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 生产环境建议把 log 去掉
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

/**
 * 让你可以写 sql`SELECT * FROM models WHERE id = ${id}`
 * 会自动把占位符转成 $1、$2… 并传 values 数组
 */
export function sql(
    strings: TemplateStringsArray,
    ...values: unknown[]
) {
    const text =
        strings
            .map((str, i) => str + (i < values.length ? `$${i + 1}` : ''))
            .join('')
            .replace(/\s+/g, ' ')
            .trim(); // 可选：压掉多余空格
    return pool.query(text, values);
}