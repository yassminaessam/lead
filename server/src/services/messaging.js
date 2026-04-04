import Settings from '../models/Settings.js';

// Send SMS using Twilio (if configured)
export async function sendSMS(to, message) {
  const settings = await Settings.findOne({ _key: 'main' });
  
  if (!settings?.twilioAccountSid || !settings?.twilioAuthToken || !settings?.twilioPhoneNumber) {
    throw new Error('Twilio SMS settings not configured');
  }

  const twilio = (await import('twilio')).default;
  const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);

  const result = await client.messages.create({
    body: message,
    from: settings.twilioPhoneNumber,
    to: to,
  });

  return { success: true, sid: result.sid };
}

// Send WhatsApp message using Twilio
export async function sendWhatsApp(to, message) {
  const settings = await Settings.findOne({ _key: 'main' });
  
  if (!settings?.whatsappEnabled) {
    throw new Error('WhatsApp is disabled');
  }

  // If using Twilio for WhatsApp
  if (settings.twilioAccountSid && settings.twilioAuthToken && settings.whatsappPhoneNumber) {
    const twilio = (await import('twilio')).default;
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);

    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${settings.whatsappPhoneNumber}`,
      to: `whatsapp:${to}`,
    });

    return { success: true, sid: result.sid };
  }

  // If using custom WhatsApp API
  if (settings.whatsappApiKey) {
    // Generic WhatsApp Business API call
    const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.whatsappApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      throw new Error('WhatsApp API request failed');
    }

    return { success: true, data: await response.json() };
  }

  throw new Error('WhatsApp not properly configured');
}

// Format WhatsApp template with variables
export function formatWhatsAppTemplate(template, variables) {
  let message = template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return message;
}
