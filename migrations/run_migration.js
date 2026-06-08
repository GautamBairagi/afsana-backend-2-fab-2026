import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.join(__dirname, 'chat_memory.sql');
const sqlQuery = fs.readFileSync(sqlPath, 'utf-8');

// Split by semicolon and run each query
const queries = sqlQuery.split(';').filter(q => q.trim().length > 0);

async function runMigration() {
    try {
        for (let query of queries) {
            console.log("Executing:", query.substring(0, 50) + "...");
            await db.execute(query);
        }
        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
