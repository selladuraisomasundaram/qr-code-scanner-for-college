import nodemailer from 'nodemailer';

// You can add as many Gmail accounts as you want here
const gmailAccounts = [
  { user: process.env.GMAIL_USER_1, pass: process.env.GMAIL_PASS_1 },
  { user: process.env.GMAIL_USER_2, pass: process.env.GMAIL_PASS_2 },
  { user: process.env.GMAIL_USER_3, pass: process.env.GMAIL_PASS_3 },
].filter(acc => acc.user && acc.pass);

const providers = [
  ...gmailAccounts.map((acc, index) => ({
    name: `Gmail-Account-${index + 1}`,
    transport: {
      service: 'gmail',
      auth: acc,
    },
  })),
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
];

export async function sendSmartEmail({ to, subject, html }) {
  let lastError = null;

  for (const provider of providers) {
    try {
      const transporter = nodemailer.createTransport(provider.transport);
      await transporter.sendMail({
        from: `"${process.env.SENDER_NAME || 'Event Team'}" <${provider.transport.auth.user}>`,
        to,
        subject,
        html,
      });
      console.log(`Email sent successfully via ${provider.name}`);
      return { success: true, provider: provider.name };
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message);
      lastError = error;
      // If a Gmail account fails (limit reached), it moves to the next one
    }
  }

  throw new Error(`All email providers failed. Last error: ${lastError?.message}`);
}