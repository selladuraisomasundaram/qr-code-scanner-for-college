import nodemailer from 'nodemailer';

const providers = [
  {
    name: 'Gmail',
    transport: {
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    },
  },
  {
    name: 'Brevo',
    transport: {
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    },
  },
  {
    name: 'Mailjet',
    transport: {
      host: 'in-v3.mailjet.com',
      port: 587,
      auth: {
        user: process.env.MAILJET_USER,
        pass: process.env.MAILJET_PASS,
      },
    },
  },
];

export async function sendSmartEmail({ to, subject, html }) {
  let lastError = null;

  for (const provider of providers) {
    // Skip if credentials are missing
    if (!provider.transport.auth.user || !provider.transport.auth.pass) continue;

    try {
      const transporter = nodemailer.createTransport(provider.transport);
      await transporter.sendMail({
        from: provider.name === 'Gmail' ? process.env.GMAIL_USER : `"Event Team" <${provider.transport.auth.user}>`,
        to,
        subject,
        html,
      });
      console.log(`Email sent successfully via ${provider.name}`);
      return { success: true, provider: provider.name };
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message);
      lastError = error;
      // Continue to the next provider in the loop
    }
  }

  throw new Error(`All email providers failed. Last error: ${lastError?.message}`);
}