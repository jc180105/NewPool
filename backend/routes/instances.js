const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper to get day of week (0-6) from a Date object safely
// ensuring we treat the date string as local YYYY-MM-DD
function getDayOfWeek(dateString) {
    // Append T12:00:00 to avoid timezone rolling to previous day
    const date = new Date(dateString + 'T12:00:00');
    return date.getDay();
}

// Get instances by range
router.get('/', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }

        const query = `
      SELECT i.*, c.name as client_name, c.address, t.service_type
      FROM service_instances i
      JOIN clients c ON i.client_id = c.id
      LEFT JOIN service_templates t ON i.template_id = t.id
      WHERE i.scheduled_date BETWEEN $1 AND $2
      ORDER BY i.scheduled_date, i.id
    `;
        const result = await pool.query(query, [start_date, end_date]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create One-off Instance
router.post('/', async (req, res) => {
    try {
        const { client_id, scheduled_date, status, visit_start } = req.body;
        // template_id is NULL for one-off
        const result = await pool.query(
            `INSERT INTO service_instances (client_id, scheduled_date, status, visit_start)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [client_id, scheduled_date, status || 'Pending', visit_start]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate Weekly Instances (The "Recurrence" Logic)
router.post('/generate', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { start_date } = req.body; // e.g., '2026-02-15' (Sunday)

        if (!start_date) {
            throw new Error('start_date is required (YYYY-MM-DD)');
        }

        // Parse start date
        // We treat the input date as the "anchor" day and iterate 7 days forward
        const anchorDate = new Date(start_date + 'T12:00:00');

        let generatedCount = 0;

        // Loop through 7 days
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(anchorDate);
            currentDate.setDate(anchorDate.getDate() + i);

            const dayOfWeek = currentDate.getDay(); // 0-6
            const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

            // Find active templates for this day of week
            const templatesRes = await client.query(
                `SELECT * FROM service_templates WHERE day_of_week = $1 AND is_active = TRUE`,
                [dayOfWeek]
            );

            for (const template of templatesRes.rows) {
                // Check if instance already exists for this template & date to avoid duplicates
                // We use template_id AND scheduled_date to check collision for recurrences
                const existing = await client.query(
                    `SELECT id FROM service_instances WHERE template_id = $1 AND scheduled_date = $2`,
                    [template.id, dateStr]
                );

                if (existing.rows.length === 0) {
                    await client.query(
                        `INSERT INTO service_instances (template_id, client_id, scheduled_date, status)
                     VALUES ($1, $2, $3, 'Pending')`,
                        [template.id, template.client_id, dateStr]
                    );
                    generatedCount++;
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Week generated successfully', created: generatedCount });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Update Instance (Drag & Drop or Status Change)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduled_date, status, visit_start } = req.body;

        // Updates ONLY the instance. Does NOT touch the template.
        // This satisfies the "Instance Specific" requirement.
        const result = await pool.query(
            `UPDATE service_instances 
       SET scheduled_date = COALESCE($1, scheduled_date), 
           status = COALESCE($2, status), 
           visit_start = COALESCE($3, visit_start)
       WHERE id = $4 RETURNING *`,
            [scheduled_date, status, visit_start, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Instance not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete instance
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM service_instances WHERE id = $1', [id]);
        res.json({ message: 'Instance deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
