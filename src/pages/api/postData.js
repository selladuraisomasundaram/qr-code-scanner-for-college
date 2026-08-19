import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { data: scannedId } = req.body;

  if (!scannedId) {
    return res.status(400).json({ message: "No ID provided" });
  }

  // Check for required environment variables
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
    console.error("Missing Environment Variables");
    return res.status(500).json({ message: "Server configuration error: Missing API credentials." });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Try to find the sheet name. Default to 'Form Responses 1' but fallback to 'Sheet1'
    const range = "A:F"; 

    // 1. Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "The spreadsheet is empty." });
    }

    // 2. Find the row with the matching Unique ID (Column E is index 4)
    let rowIndex = -1;
    let userData = null;

    for (let i = 0; i < rows.length; i++) {
      // Check if the ID matches (trimming whitespace just in case)
      if (rows[i][4] && rows[i][4].toString().trim() === scannedId.toString().trim()) {
        rowIndex = i + 1; // Google Sheets is 1-indexed
        userData = {
          name: rows[i][1] || "Unknown Participant",
          email: rows[i][2] || "No Email",
          status: rows[i][5] || "Pending",
        };
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Invalid Ticket: ID not found in records." });
    }

    // 3. Check if already checked in
    if (userData.status === "Checked In") {
      return res.status(400).json({ 
        message: "This ticket has already been used.", 
        name: userData.name 
      });
    }

    // 4. Update Status to "Checked In" (Column F)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `F${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Checked In"]],
      },
    });

    return res.status(200).json({ 
      message: "Check-in Successful!", 
      name: userData.name 
    });

  } catch (error) {
    console.error("Google Sheets API Error:", error.message);
    return res.status(500).json({ 
      message: "Connection to Google Sheets failed.", 
      error: error.message 
    });
  }
}