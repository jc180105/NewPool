const { Pool } = require('pg');
const dotenv = require('dotenv');

// We need to use the connection string explicitly or load from env if running locally with .env
// Assuming the user will run this locally against the remote DB or deploy it.
// For safety, I'll use the hardcoded remote string the user gave earlier or rely on process.env if they run it in context.
// User provided: postgresql://postgres:iKiDhXuhlbfzfhSAstngphzUOBjghGby@caboose.proxy.rlwy.net:12007/railway

const connectionString = 'postgresql://postgres:iKiDhXuhlbfzfhSAstngphzUOBjghGby@caboose.proxy.rlwy.net:12007/railway';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Connecting to database to add "price" column...');
        const client = await pool.connect();

        try {
            await client.query(`ALTER TABLE service_instances ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);`);
            console.log('Successfully added "price" column to service_instances.');
        } catch (e) {
            console.log('Error adding column (might already exist):', e.message);
        }

        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
