import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Participant ID is required" });
  }

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
    return res.status(500).json({ message: "Server configuration error: Missing API credentials." });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A:Z",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Database is empty." });
    }

    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const idIndex = headers.findIndex(h => h.includes("unique id") || h === "id");
    const nameIndex = headers.findIndex(h => h.includes("name") || h.includes("full name"));
    const emailIndex = headers.findIndex(h => h.includes("email") || h.includes("email address"));
    const photoIndex = headers.findIndex(h => h.includes("photo") || h.includes("image") || h.includes("file") || h.includes("picture") || h.includes("upload"));

    if (idIndex === -1) {
      return res.status(500).json({ message: "Spreadsheet misconfiguration: Unique ID column not found." });
    }

    let participant = null;

    // Search for row containing the ID (skipping header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[idIndex] && row[idIndex].toString().trim() === id.toString().trim()) {
        participant = {
          name: nameIndex !== -1 ? row[nameIndex] || "" : "",
          email: emailIndex !== -1 ? row[emailIndex] || "" : "",
          photoUrl: photoIndex !== -1 ? row[photoIndex] || "" : "",
        };
        break;
      }
    }

    if (!participant) {
      return res.status(404).json({ message: "Participant not found." });
    }

    return res.status(200).json(participant);
  } catch (error) {
    console.error("Error in getParticipant API:", error);
    return res.status(500).json({ message: "Google Sheets error", error: error.message });
  }
}
