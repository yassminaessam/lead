import { Router } from 'express';
import { sendSMS, sendWhatsApp, formatWhatsAppTemplate } from '../services/messaging.js';
import Settings from '../models/Settings.js';

const router = Router();

// Test SMS connection
router.post('/sms/test', async (req, res) => {
  try {
    const settings = await Settings.findOne({ _key: 'main' });
    
    if (!settings?.twilioAccountSid || !settings?.twilioAuthToken) {
      return res.status(400).json({ success: false, error: 'Twilio credentials not configured' });
    }

    // Verify Twilio credentials
    const twilio = (await import('twilio')).default;
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
    
    // Try to fetch account info to verify credentials
    await client.api.accounts(settings.twilioAccountSid).fetch();
    
    res.json({ success: true, message: 'Twilio connection successful' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Send SMS
router.post('/sms/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    const result = await sendSMS(to, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test WhatsApp connection
router.post('/whatsapp/test', async (req, res) => {
  try {
    const settings = await Settings.findOne({ _key: 'main' });
    
    if (!settings?.whatsappEnabled) {
      return res.status(400).json({ success: false, error: 'WhatsApp is disabled' });
    }

    if (!settings?.whatsappApiKey && !settings?.twilioAccountSid) {
      return res.status(400).json({ success: false, error: 'WhatsApp credentials not configured' });
    }

    // If using Twilio for WhatsApp
    if (settings.twilioAccountSid && settings.twilioAuthToken) {
      const twilio = (await import('twilio')).default;
      const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
      await client.api.accounts(settings.twilioAccountSid).fetch();
      return res.json({ success: true, message: 'WhatsApp (Twilio) connection successful' });
    }

    res.json({ success: true, message: 'WhatsApp API key configured' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Send WhatsApp message
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { to, message, useTemplate, templateVars } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Missing required field: to' });
    }

    let finalMessage = message;
    
    if (useTemplate && templateVars) {
      const settings = await Settings.findOne({ _key: 'main' });
      finalMessage = formatWhatsAppTemplate(settings.whatsappTemplate, templateVars);
    }

    if (!finalMessage) {
      return res.status(400).json({ error: 'Missing message or template variables' });
    }

    const result = await sendWhatsApp(to, finalMessage);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
