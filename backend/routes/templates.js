const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all templates (optionally filter by client_id)
router.get('/', async (req, res) => {
    try {
        const { client_id } = req.query;
        let query = 'SELECT * FROM service_templates';
        const params = [];
        if (client_id) {
            query += ' WHERE client_id = $1';
            params.push(client_id);
        }
        query += ' ORDER BY day_of_week';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new template
router.post('/', async (req, res) => {
    try {
        const { client_id, day_of_week, service_type } = req.body;
        const result = await pool.query(
            `INSERT INTO service_templates (client_id, day_of_week, service_type)
       VALUES ($1, $2, $3) RETURNING *`,
            [client_id, day_of_week, service_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update template
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { day_of_week, service_type, is_active } = req.body;
        const result = await pool.query(
            `UPDATE service_templates SET day_of_week = $1, service_type = $2, is_active = $3
       WHERE id = $4 RETURNING *`,
            [day_of_week, service_type, is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete template
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM service_templates WHERE id = $1', [id]);
        res.json({ message: 'Template deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
