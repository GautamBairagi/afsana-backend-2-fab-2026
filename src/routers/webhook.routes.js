import express from 'express';
import { verifyFacebookWebhook, handleFacebookEvent } from '../controllers/facebook.webhook.controller.js';
import { verifyWhatsappWebhook, handleWhatsappMessage } from '../controllers/whatsapp.webhook.controller.js';

const router = express.Router();

// Facebook Messenger / Lead Ads Webhooks
router.get('/facebook', verifyFacebookWebhook);
router.post('/facebook', handleFacebookEvent);

// WhatsApp Cloud API Webhooks
router.get('/whatsapp', verifyWhatsappWebhook);
router.post('/whatsapp', handleWhatsappMessage);

export default router;
