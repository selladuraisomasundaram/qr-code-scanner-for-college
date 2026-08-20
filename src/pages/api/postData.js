import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check for required environment variables
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
    console.error("Missing Environment Variables");
    return res.status(500).json({ message: "Server configuration error: Missing API credentials." });
  }

  // GET: Fetch list of unique events from the Google Sheet
  if (req.method === "GET") {
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
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "A:Z",
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return res.status(200).json({ events: [] });
      }

      // Find the event column header dynamically
      const headers = rows[0].map(h => h.toString().toLowerCase().trim());
      const eventColIndex = headers.findIndex(h => h.includes("event"));
      
      if (eventColIndex === -1) {
        return res.status(200).json({ events: [] });
      }

      const eventsSet = new Set();
      for (let i = 1; i < rows.length; i++) {
        const val = rows[i][eventColIndex];
        if (val) {
          // Split by comma to support multiple events per row (e.g. "Coding, Web Design")
          val.split(",").forEach(e => {
            const trimmed = e.trim();
            if (trimmed) eventsSet.add(trimmed);
          });
        }
      }

      return res.status(200).json({ events: Array.from(eventsSet).sort() });
    } catch (error) {
      console.error("Google Sheets API Error (GET):", error.message);
      return res.status(500).json({ 
        message: "Failed to fetch events from Google Sheets.", 
        error: error.message 
      });
    }
  }

  // POST: Verify scanned ticket ID and check in
  const { data: scannedId, event: selectedEvent } = req.body;

  if (!scannedId) {
    return res.status(400).json({ message: "No ID provided" });
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
    
    // Get all data from the sheet (up to column Z to ensure we fetch events)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A:Z",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "The spreadsheet is empty." });
    }

    // Parse headers to locate all columns dynamically
    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const idColIndex = headers.findIndex(h => h.includes("unique id") || h === "id");
    const statusColIndex = headers.findIndex(h => h.includes("status") && !h.includes("event"));
    const eventColIndex = headers.findIndex(h => h.includes("event") && !h.includes("status"));
    const nameColIndex = headers.findIndex(h => h.includes("name") || h.includes("full name"));
    const emailColIndex = headers.findIndex(h => h.includes("email"));
    const event1ColIndex = headers.findIndex(h => h.includes("event 1 status") || h.includes("event1 status") || h.includes("event 1"));
    const event2ColIndex = headers.findIndex(h => h.includes("event 2 status") || h.includes("event2 status") || h.includes("event 2"));

    // Fallbacks if headers not detected
    const idIndex = idColIndex !== -1 ? idColIndex : 5; // Column F
    const statusIndex = statusColIndex !== -1 ? statusColIndex : 6; // Column G
    const eventIndex = eventColIndex !== -1 ? eventColIndex : 4; // Column E
    const nameIndex = nameColIndex !== -1 ? nameColIndex : 1; // Column B
    const emailIndex = emailColIndex !== -1 ? emailColIndex : 2; // Column C
    const event1StatusIndex = event1ColIndex !== -1 ? event1ColIndex : 7; // Column H
    const event2StatusIndex = event2ColIndex !== -1 ? event2ColIndex : 8; // Column I

    // Find the row with the matching Unique ID
    let rowIndex = -1;
    let userData = null;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][idIndex] && rows[i][idIndex].toString().trim() === scannedId.toString().trim()) {
        rowIndex = i + 1; // Google Sheets is 1-indexed
        userData = {
          name: rows[i][nameIndex] || "Unknown Participant",
          email: rows[i][emailIndex] || "No Email",
          status: rows[i][statusIndex] || "Pending",
          events: eventIndex !== -1 ? rows[i][eventIndex] || "" : "",
        };
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Invalid Ticket: ID not found in records." });
    }

    // If verification is for a specific event (Event Manager)
    if (selectedEvent) {
      if (eventColIndex === -1) {
        return res.status(400).json({
          message: "Event verification is not configured. No 'event' column header found in the spreadsheet."
        });
      }

      // 1. Participant must be checked in at the main gate
      if (userData.status !== "Checked In") {
        return res.status(400).json({
          message: "Access Denied: Participant must first check in at the Main Gate.",
          name: userData.name
        });
      }
      
      // 2. Verify participant is registered for this event
      const participantEvents = userData.events.toString().split(",").map(e => e.trim().toLowerCase());
      const targetEvent = selectedEvent.toString().trim().toLowerCase();
      
      const isRegistered = participantEvents.some(pe => pe === targetEvent);
      if (!isRegistered) {
        return res.status(400).json({ 
          message: `Access Denied: Participant is not registered for "${selectedEvent}". Registered events: ${userData.events || "None"}.`,
          name: userData.name 
        });
      }

      // 3. Max 2 event entries validation
      const currentRow = rows[rowIndex - 1] || [];
      const event1Val = currentRow[event1StatusIndex] ? currentRow[event1StatusIndex].toString().trim() : "";
      const event2Val = currentRow[event2StatusIndex] ? currentRow[event2StatusIndex].toString().trim() : "";

      const event1Lower = event1Val.toLowerCase();
      const event2Lower = event2Val.toLowerCase();

      // Check if already checked in to this specific event
      if (event1Lower === targetEvent || event2Lower === targetEvent) {
        return res.status(200).json({
          message: `Already checked in for ${selectedEvent}!`,
          name: userData.name
        });
      }

      // Check if limit of 2 is exceeded
      if (event1Val && event2Val) {
        return res.status(400).json({
          message: `Access Denied: Participant already checked in to 2 events (${event1Val}, ${event2Val}). Max 2 allowed.`,
          name: userData.name
        });
      }

      // Update the free event status column
      const targetColIndex = !event1Val ? event1StatusIndex : event2StatusIndex;
      const colLetter = String.fromCharCode(65 + targetColIndex);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[selectedEvent]],
        },
      });

    } else {
      // General entry (Volunteer): check if already checked in
      if (userData.status === "Checked In") {
        return res.status(400).json({ 
          message: "This ticket has already been used.", 
          name: userData.name 
        });
      }

      // Update Status to "Checked In" (Column F/G)
      const colLetter = String.fromCharCode(65 + statusIndex);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Checked In"]],
        },
      });
    }

    return res.status(200).json({ 
      message: selectedEvent ? `Check-in approved for ${selectedEvent}!` : "Check-in Successful!", 
      name: userData.name 
    });

  } catch (error) {
    console.error("Google Sheets API Error (POST):", error.message);
    return res.status(500).json({ 
      message: "Connection to Google Sheets failed.", 
      error: error.message 
    });
  }
}