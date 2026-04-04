import { Router } from 'express';
import nodemailer from 'nodemailer';
import Settings from '../models/Settings.js';

const router = Router();

// Create transporter based on current settings
async function createTransporter() {
  const settings = await Settings.findOne({ _key: 'main' });
  if (!settings || !settings.smtpEmail || !settings.smtpPassword) {
    throw new Error('Email settings not configured');
  }

  return nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.gmail.com',
    port: parseInt(settings.smtpPort) || 587,
    secure: parseInt(settings.smtpPort) === 465,
    auth: {
      user: settings.smtpEmail,
      pass: settings.smtpPassword,
    },
  });
}

// Test email connection
router.post('/test', async (req, res) => {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    res.json({ success: true, message: 'Email connection successful' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Send email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'Missing required fields: to, subject' });
    }

    const settings = await Settings.findOne({ _key: 'main' });
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${settings.companyName || 'LeadEngine'}" <${settings.smtpEmail}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    };

    // Add signature if exists
    if (settings.emailSignature) {
      if (html) {
        mailOptions.html += `<br><br><pre>${settings.emailSignature}</pre>`;
      } else {
        mailOptions.text += `\n\n${settings.emailSignature}`;
      }
    }

    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send follow-up reminder email
router.post('/followup-reminder', async (req, res) => {
  try {
    const { leadName, companyName, phone, followupDate, recipientEmail } = req.body;

    if (!recipientEmail || !leadName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const settings = await Settings.findOne({ _key: 'main' });
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${settings.companyName || 'LeadEngine'}" <${settings.smtpEmail}>`,
      to: recipientEmail,
      subject: `تذكير متابعة: ${companyName || leadName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">تذكير متابعة</h2>
          <p>لديك موعد متابعة مع:</p>
          <table style="border-collapse: collapse; margin: 15px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">الاسم:</td>
              <td style="padding: 8px;">${leadName}</td>
            </tr>
            ${companyName ? `<tr>
              <td style="padding: 8px; font-weight: bold;">الشركة:</td>
              <td style="padding: 8px;">${companyName}</td>
            </tr>` : ''}
            ${phone ? `<tr>
              <td style="padding: 8px; font-weight: bold;">الهاتف:</td>
              <td style="padding: 8px;" dir="ltr">${phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; font-weight: bold;">الموعد:</td>
              <td style="padding: 8px;">${new Date(followupDate).toLocaleString('ar-EG')}</td>
            </tr>
          </table>
          <p style="color: #666;">${settings.emailSignature || ''}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send new lead notification email
router.post('/new-lead-notification', async (req, res) => {
  try {
    const { leadName, companyName, phone, email, source, recipientEmail } = req.body;

    if (!recipientEmail || !leadName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const settings = await Settings.findOne({ _key: 'main' });
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${settings.companyName || 'LeadEngine'}" <${settings.smtpEmail}>`,
      to: recipientEmail,
      subject: `عميل محتمل جديد: ${companyName || leadName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">🎉 عميل محتمل جديد!</h2>
          <table style="border-collapse: collapse; margin: 15px 0; width: 100%; max-width: 400px;">
            <tr style="background: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">الاسم:</td>
              <td style="padding: 10px;">${leadName}</td>
            </tr>
            ${companyName ? `<tr>
              <td style="padding: 10px; font-weight: bold;">الشركة:</td>
              <td style="padding: 10px;">${companyName}</td>
            </tr>` : ''}
            ${phone ? `<tr style="background: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">الهاتف:</td>
              <td style="padding: 10px;" dir="ltr">${phone}</td>
            </tr>` : ''}
            ${email ? `<tr>
              <td style="padding: 10px; font-weight: bold;">البريد:</td>
              <td style="padding: 10px;">${email}</td>
            </tr>` : ''}
            ${source ? `<tr style="background: #f3f4f6;">
              <td style="padding: 10px; font-weight: bold;">المصدر:</td>
              <td style="padding: 10px;">${source}</td>
            </tr>` : ''}
          </table>
          <p style="color: #666; margin-top: 20px;">${settings.emailSignature || ''}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
