import { sendSmartEmail } from "@/utils/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { to, subject, html, text } = req.body || {};

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: to, subject, and either html or text" 
    });
  }

  try {
    const result = await sendSmartEmail({ to, subject, html, text });
    return res.status(200).json({ 
      success: true, 
      message: "Email sent successfully", 
      provider: result.provider 
    });
  } catch (error) {
    console.error("Fallback Mail API Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to send email" 
    });
  }
}
