import { google } from "googleapis";
import { sendSmartEmail } from "@/utils/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { name, email } = req.body;
  const uniqueId = `PEC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const passUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/pass/${uniqueId}`;

  try {
    // 1. Save to Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toISOString(), name, email, "", "", uniqueId, "Pending"]],
      },
    });

    // 2. Send Email using the Smart Mailer
    await sendSmartEmail({
      to: email,
      subject: `Your Event Pass - ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2>Hi ${name}, you're registered!</h2>
          <p>Your unique entry ID is: <strong>${uniqueId}</strong></p>
          <p>Click the button below to view and download your digital QR pass:</p>
          <a href="${passUrl}" style="display: inline-block; padding: 12px 24px; background: #ea580c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View My Pass</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Please show this pass at the entry gate.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "Registration successful!", uniqueId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}