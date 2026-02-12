const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all clients
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new client
router.post('/', async (req, res) => {
    try {
        const { name, phone, address, neighborhood, geo_lat, geo_lng, fixed_price, payment_due_day, last_sand_change } = req.body;

        // Sanitize inputs: Convert empty strings to null for numeric/date fields
        const sanitized = {
            fixed_price: fixed_price === '' ? null : fixed_price,
            payment_due_day: payment_due_day === '' ? null : payment_due_day,
            last_sand_change: last_sand_change === '' ? null : last_sand_change,
            geo_lat: geo_lat === '' ? null : geo_lat,
            geo_lng: geo_lng === '' ? null : geo_lng
        };

        const result = await pool.query(
            `INSERT INTO clients (name, phone, address, neighborhood, geo_lat, geo_lng, fixed_price, payment_due_day, last_sand_change)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, phone, address, neighborhood, sanitized.geo_lat, sanitized.geo_lng, sanitized.fixed_price, sanitized.payment_due_day, sanitized.last_sand_change]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, neighborhood, geo_lat, geo_lng, fixed_price, payment_due_day, last_sand_change } = req.body;

        // Sanitize inputs
        const sanitized = {
            fixed_price: fixed_price === '' ? null : fixed_price,
            payment_due_day: payment_due_day === '' ? null : payment_due_day,
            last_sand_change: last_sand_change === '' ? null : last_sand_change,
            geo_lat: geo_lat === '' ? null : geo_lat,
            geo_lng: geo_lng === '' ? null : geo_lng
        };

        const result = await pool.query(
            `UPDATE clients SET name = $1, phone = $2, address = $3, neighborhood = $4, geo_lat = $5, geo_lng = $6, fixed_price = $7, payment_due_day = $8, last_sand_change = $9
       WHERE id = $10 RETURNING *`,
            [name, phone, address, neighborhood, sanitized.geo_lat, sanitized.geo_lng, sanitized.fixed_price, sanitized.payment_due_day, sanitized.last_sand_change, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM clients WHERE id = $1', [id]);
        res.json({ message: 'Client deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
