import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
    return res.status(500).json({ message: "Server configuration error: Missing API credentials." });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  // GET: Fetch hardcoded departments and event lists for trial process (CSE, ECE, AGRI, CYBER)
  if (req.method === "GET") {
    return res.status(200).json({
      departments: {
        "CSE": ["Event A", "Event B"],
        "ECE": ["Event C", "Event D"],
        "AGRI": ["Event E", "Event F"],
        "CYBER": ["Event G", "Event H"]
      }
    });
  }

  // POST: Verify scanned ticket ID and check in
  const { data: scannedId, event: selectedEvent } = req.body;

  if (!scannedId) {
    return res.status(400).json({ message: "No ID provided" });
  }

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetName = spreadsheet.data.sheets[0].properties.title;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "The spreadsheet is empty." });
    }

    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const idIndex = headers.findIndex(h => h.includes("unique id") || h === "id");
    const statusIndex = headers.findIndex(h => h.includes("status") && !h.includes("event"));
    const eventIndex = headers.findIndex(h => h.includes("event") && !h.includes("status"));
    const nameIndex = headers.findIndex(h => h.includes("name") || h.includes("full name"));
    const event1StatusIndex = headers.findIndex(h => h.includes("event 1 status") || h.includes("event1 status") || h.includes("event 1"));
    const event2StatusIndex = headers.findIndex(h => h.includes("event 2 status") || h.includes("event2 status") || h.includes("event 2"));

    let rowIndex = -1;
    let userData = null;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][idIndex] && rows[i][idIndex].toString().trim() === scannedId.toString().trim()) {
        rowIndex = i + 1;
        userData = {
          name: rows[i][nameIndex] || "Unknown Participant",
          status: rows[i][statusIndex] || "Pending",
          events: eventIndex !== -1 ? rows[i][eventIndex] || "" : "",
        };
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Invalid Ticket: ID not found." });
    }

    if (selectedEvent) {
      if (userData.status !== "Checked In") {
        return res.status(400).json({ message: "Access Denied: Must check in at Main Gate first.", name: userData.name });
      }
      
      const participantEvents = userData.events.toString().split(",").map(e => e.trim().toLowerCase());
      const targetEvent = selectedEvent.toString().trim().toLowerCase();
      
      if (!participantEvents.some(pe => pe === targetEvent)) {
        return res.status(400).json({ 
          message: `Access Denied: Not registered for "${selectedEvent}".`,
          name: userData.name 
        });
      }

      const currentRow = rows[rowIndex - 1] || [];
      const event1Val = currentRow[event1StatusIndex] || "";
      const event2Val = currentRow[event2StatusIndex] || "";

      if (event1Val.toLowerCase() === targetEvent || event2Val.toLowerCase() === targetEvent) {
        return res.status(200).json({ message: `Already checked in for ${selectedEvent}!`, name: userData.name });
      }

      if (event1Val && event2Val) {
        return res.status(400).json({ message: "Access Denied: Max 2 events reached.", name: userData.name });
      }

      const targetColIndex = !event1Val ? event1StatusIndex : event2StatusIndex;
      const colLetter = String.fromCharCode(65 + targetColIndex);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[selectedEvent]] },
      });

    } else {
      if (userData.status === "Checked In") {
        return res.status(400).json({ message: "Already checked in at Main Gate.", name: userData.name });
      }

      const colLetter = String.fromCharCode(65 + statusIndex);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["Checked In"]] },
      });
    }

    return res.status(200).json({ 
      message: selectedEvent ? `Approved for ${selectedEvent}!` : "Main Gate Check-in Successful!", 
      name: userData.name 
    });

  } catch (error) {
    return res.status(500).json({ message: "Google Sheets error", error: error.message });
  }
}