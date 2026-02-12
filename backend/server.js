const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');
const cron = require('node-cron');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic route to test server
app.get('/', (req, res) => {
    res.json({ message: 'PoolService Manager API is running' });
});

// Import route handlers
app.use('/clients', require('./routes/clients'));
app.use('/templates', require('./routes/templates'));
app.use('/instances', require('./routes/instances'));
app.use('/expenses', require('./routes/expenses'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
