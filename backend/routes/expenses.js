const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all expenses (optionally filtered by date)
router.get('/', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = 'SELECT * FROM expenses';
        const params = [];

        if (start_date && end_date) {
            query += ' WHERE expense_date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY expense_date DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new expense
router.post('/', async (req, res) => {
    try {
        const { service_instance_id, description, amount, expense_date, category } = req.body;
        const result = await pool.query(
            `INSERT INTO expenses (service_instance_id, description, amount, expense_date, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [service_instance_id, description, amount, expense_date, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, expense_date, category } = req.body;
        const result = await pool.query(
            `UPDATE expenses SET description = $1, amount = $2, expense_date = $3, category = $4
       WHERE id = $5 RETURNING *`,
            [description, amount, expense_date, category, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
