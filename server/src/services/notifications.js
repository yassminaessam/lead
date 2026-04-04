import Settings from '../models/Settings.js';
import nodemailer from 'nodemailer';
import { sendSMS, sendWhatsApp, formatWhatsAppTemplate } from './messaging.js';

// Get settings
async function getSettings() {
  return await Settings.findOne({ _key: 'main' });
}

// Create email transporter
async function createEmailTransporter() {
  const settings = await getSettings();
  if (!settings?.smtpEmail || !settings?.smtpPassword) {
    return null;
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

// Send notification based on settings
export async function sendNotification(type, data) {
  const settings = await getSettings();
  const results = { email: null, sms: null, whatsapp: null };

  // Check if this notification type is enabled
  const typeEnabled = {
    'new_lead': settings?.notifyNewLead,
    'missed_call': settings?.notifyMissedCall,
    'follow_up': settings?.notifyFollowUp,
  };

  if (!typeEnabled[type]) {
    return { skipped: true, reason: 'Notification type disabled' };
  }

  // Send Email notification
  if (settings?.emailNotifications && data.recipientEmail) {
    try {
      const transporter = await createEmailTransporter();
      if (transporter) {
        const mailOptions = {
          from: `"${settings.companyName || 'LeadEngine'}" <${settings.smtpEmail}>`,
          to: data.recipientEmail,
          subject: data.emailSubject || 'إشعار من LeadEngine',
          html: data.emailBody || data.message,
        };

        if (settings.emailSignature) {
          mailOptions.html += `<br><br><pre>${settings.emailSignature}</pre>`;
        }

        const info = await transporter.sendMail(mailOptions);
        results.email = { success: true, messageId: info.messageId };
      }
    } catch (err) {
      results.email = { success: false, error: err.message };
    }
  }

  // Send SMS notification
  if (settings?.smsNotifications && data.recipientPhone) {
    try {
      const smsResult = await sendSMS(data.recipientPhone, data.smsMessage || data.message);
      results.sms = smsResult;
    } catch (err) {
      results.sms = { success: false, error: err.message };
    }
  }

  // Send WhatsApp notification
  if (settings?.whatsappEnabled && data.recipientPhone) {
    try {
      let message = data.whatsappMessage || data.message;
      
      // Use template if available
      if (settings.whatsappTemplate && data.templateVars) {
        message = formatWhatsAppTemplate(settings.whatsappTemplate, data.templateVars);
      }

      const waResult = await sendWhatsApp(data.recipientPhone, message);
      results.whatsapp = waResult;
    } catch (err) {
      results.whatsapp = { success: false, error: err.message };
    }
  }

  return results;
}

// Specific notification senders
export async function notifyNewLead(lead, recipientEmail, recipientPhone) {
  return sendNotification('new_lead', {
    recipientEmail,
    recipientPhone,
    emailSubject: `🎉 عميل محتمل جديد: ${lead.company_name || lead.contact_name}`,
    emailBody: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">عميل محتمل جديد!</h2>
        <p><strong>الاسم:</strong> ${lead.contact_name}</p>
        <p><strong>الشركة:</strong> ${lead.company_name || '-'}</p>
        <p><strong>الهاتف:</strong> ${lead.phone}</p>
        <p><strong>المصدر:</strong> ${lead.source || '-'}</p>
      </div>
    `,
    smsMessage: `عميل جديد: ${lead.company_name || lead.contact_name} - ${lead.phone}`,
    message: `عميل محتمل جديد: ${lead.company_name || lead.contact_name}`,
    templateVars: {
      name: lead.contact_name,
      company: lead.company_name || '',
      phone: lead.phone,
    },
  });
}

export async function notifyMissedCall(lead, recipientEmail, recipientPhone) {
  return sendNotification('missed_call', {
    recipientEmail,
    recipientPhone,
    emailSubject: `📞 مكالمة فائتة: ${lead.company_name || lead.contact_name}`,
    emailBody: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ef4444;">مكالمة فائتة</h2>
        <p><strong>العميل:</strong> ${lead.contact_name}</p>
        <p><strong>الشركة:</strong> ${lead.company_name || '-'}</p>
        <p><strong>الهاتف:</strong> ${lead.phone}</p>
      </div>
    `,
    smsMessage: `مكالمة فائتة من: ${lead.company_name || lead.contact_name} - ${lead.phone}`,
    message: `مكالمة فائتة من: ${lead.company_name || lead.contact_name}`,
  });
}

export async function notifyFollowUp(lead, followupDate, recipientEmail, recipientPhone) {
  const dateStr = new Date(followupDate).toLocaleString('ar-EG');
  
  return sendNotification('follow_up', {
    recipientEmail,
    recipientPhone,
    emailSubject: `⏰ تذكير متابعة: ${lead.company_name || lead.contact_name}`,
    emailBody: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #667eea;">تذكير متابعة</h2>
        <p><strong>العميل:</strong> ${lead.contact_name}</p>
        <p><strong>الشركة:</strong> ${lead.company_name || '-'}</p>
        <p><strong>الهاتف:</strong> ${lead.phone}</p>
        <p><strong>الموعد:</strong> ${dateStr}</p>
      </div>
    `,
    smsMessage: `تذكير متابعة: ${lead.company_name || lead.contact_name} - ${dateStr}`,
    message: `تذكير متابعة مع: ${lead.company_name || lead.contact_name}`,
  });
}
