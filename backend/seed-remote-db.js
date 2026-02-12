const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string provided by user
const connectionString = 'postgresql://postgres:iKiDhXuhlbfzfhSAstngphzUOBjghGby@caboose.proxy.rlwy.net:12007/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Railway/Cloud DBs usually
});

async function seed() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected!');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        await client.query(schema);
        console.log('Schema applied successfully!');

        client.release();
    } catch (err) {
        console.error('Error applying schema:', err);
    } finally {
        await pool.end();
    }
}

seed();
