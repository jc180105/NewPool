const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');
const cron = require('node-cron');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic route to test server and setup DB
app.get('/setup-db', async (req, res) => {
    try {
        const fs = require('fs');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schema);
        res.send('Database schema applied successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error applying schema: ' + err.message);
    }
});

// Import route handlers
app.use('/clients', require('./routes/clients'));
app.use('/templates', require('./routes/templates'));
app.use('/instances', require('./routes/instances'));
app.use('/expenses', require('./routes/expenses'));

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
