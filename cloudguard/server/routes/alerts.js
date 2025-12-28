const express = require('express');
const router = express.Router();
const AlertManager = require('../managers/AlertManager');
const AlertRepository = require('../repositories/AlertRepository');
const AuditLogManager = require('../services/AuditLogManager');
const { getDB } = require('../config/database');

// Initialize managers
let alertManager;

// Middleware to initialize AlertManager
router.use((req, res, next) => {
    try {
        const db = getDB();
        const alertRepository = new AlertRepository(db);
        const auditLogManager = new AuditLogManager(db);
        alertManager = new AlertManager(alertRepository, auditLogManager);
        next();
    } catch (error) {
        res.status(500).json({ error: 'Database not initialized' });
    }
});

// GET all alerts
router.get('/', async (req, res) => {
    try {
        const filters = {
            severity: req.query.severity,
            status: req.query.status,
            category: req.query.category
        };
        const alerts = await alertManager.getAlerts(filters);
        res.json(alerts);
    } catch (error) {
        console.error('Error getting alerts:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET single alert
router.get('/:id', async (req, res) => {
    try {
        const alert = await alertManager.getAlertById(req.params.id);
        res.json(alert);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// POST create new alert
router.post('/', async (req, res) => {
    try {
        const finding = req.body;
        const alert = await alertManager.createAlert(finding);
        res.status(201).json(alert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update alert status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const alert = await alertManager.updateAlertStatus(req.params.id, status);
        res.json(alert);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE alert
router.delete('/:id', async (req, res) => {
    try {
        await alertManager.deleteAlert(req.params.id);
        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await alertManager.getStatistics();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
