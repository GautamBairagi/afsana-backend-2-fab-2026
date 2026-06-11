import express from 'express';
import { getScannerStatus } from '../services/whatsappScanner.service.js';

const router = express.Router();

router.get('/qr-status', (req, res) => {
    try {
        const { status, qr } = getScannerStatus();
        res.status(200).json({ success: true, status, qr });
    } catch (error) {
        console.error('[WhatsApp Scanner API] Error fetching status:', error);
        res.status(500).json({ success: false, error: 'Failed to get scanner status' });
    }
});

export default router;
