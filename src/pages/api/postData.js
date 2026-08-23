import { google } from "googleapis";

const cleanString = (str) => {
  if (!str) return "";
  let s = str.toString().replace(/\s*\(.*?\)\s*/g, ""); // Remove parenthesized content like (Cyber Security)
  s = s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(); // Remove spaces, hyphens, and slashes
  if (s.endsWith("s") && s.length > 3) {
    s = s.slice(0, -1); // Strip trailing 's' to match singular and plural (Busters vs Buster)
  }
  return s;
};

const getColumnLetter = (colIndex) => {
  let temp = colIndex;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

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

  // GET: Fetch hardcoded departments, workshop events, and common events for PEC-Techfinix’26
  if (req.method === "GET") {
    return res.status(200).json({
      commonEvents: [
        "PAPER PRESENTATION", 
        "PROJECT EXPO", 
        "TREASURE HUNT",
        "PHOTOGRAPHY",
        "SOLO SINGING",
        "ADAPTUNE (SOLO DANCE)",
        "SHORT FILM CONTEST",
        "CHANNEL SURFING"
      ],
      workshopEvents: ["Edge AI and TinyML for Intelligent IoT"],
      departments: {
        "AERO": ["Drone Racing League", "Glider Competition", "Parachute Diving"],
        "Cyber Security": ["Cyber Myth Busters", "Encryption Puzzle Race", "Code Breaker"],
        "IT": ["Blind Coding", "Rapid Replica", "Master The Prompt"],
        "Civil": ["Straw Tower Challenges", "Eco - Brick / Cube Contest", "Error Spotter"],
        "IoT": ["Circuit Draft", "Mind Maze", "VOLTX ARENA"],
        "CSE": ["Terminal Velocity", "The Architect's Trial", "Source Code Forensics"],
        "Agri": ["AgriX Vision", "Therma Chain", "Power Hitch Plays"],
        "AIDS": ["Data Escape Room", "Train Your AI in 30 Minutes", "AI Ethics Court"],
        "AIML": ["AI Vision Craft", "AI TRI Quest", "AI Spin and Solve"],
        "ECE": ["Signal Spy", "Smart Fault Hunter", "Zero Power Innovation"],
        "Chemical": ["Reactathon", "Case Study Analysis", "Periodic Table Bingo"],
        "Mech": ["Techinical Quiz", "CAD Contest", "Water Rocketey"],
        "Food Tech": ["Food Forensic", "Fluxguard", "Deductra"],
        "Pharma": ["Pharma Storytelling Event", "One Minute Health Talk", "Ad Making"],
        "R&A": ["Track Bottle Challenge", "Ladder Logic League", "ROBO AI Posted Expo"],
        "Bio Tech": ["Docking Challenge", "Experiment Detection Challenge", "Bio Molecule Puzzle"],
        "BME": ["Bio Medical Quiz Bowl", "Bio Medical Circuit Debugging", "Med Poster"],
        "MCT": ["Circuit Design Challenges", "CAD Modelling Competition", "AI Model Building Challenge"],
        "MCA": ["Idea Presenatation Summit", "Web Craft", "Reverse Coding"],
        "MBA": ["Roll Play", "Case Study", "Campus Stories"],
        "EEE": ["Power AI", "Electro Drive", "VoltQuest"]
      }
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // POST: Verify scanned ticket ID and check in for specific category
  const { data: scannedId, event: selectedEvent, category } = req.body;

  if (!scannedId) {
    return res.status(400).json({ message: "No ID provided" });
  }

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetName = spreadsheet.data.sheets[0].properties.title;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:AZ`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "The spreadsheet is empty." });
    }

    const headers = rows[0].map(h => h.toString().toLowerCase().trim());

    // Find index locations dynamically
    const idIndexRaw = headers.findIndex(h => h.includes("unique id") || h === "id");
    const nameIndexRaw = headers.findIndex(h => h.includes("name"));
    const statusIndexRaw = headers.findIndex(h => h === "status" && !h.includes("event") && !h.includes("workshop"));
    
    const commonEventIndexRaw = headers.findIndex(h => h.includes("common event") && !h.includes("status"));
    const workshopParticipationIndexRaw = headers.findIndex(h => h.includes("workshop") && !h.includes("status"));
    const deptEventIndexRaw = headers.findIndex(h => 
      !h.includes("common") &&
      (h.includes("department event") || h.includes("dept event") || h.includes("select events in which you are participating")) && 
      !h.includes("status")
    );

    const common1StatusIndexRaw = headers.findIndex(h => h.includes("common event 1 status") || h.includes("common event 1"));
    const common2StatusIndexRaw = headers.findIndex(h => h.includes("common event 2 status") || h.includes("common event 2"));
    const workshopStatusIndexRaw = headers.findIndex(h => h.includes("workshop status"));
    const dept1StatusIndexRaw = headers.findIndex(h => h.includes("dept event 1 status") || h.includes("dept event 1") || h.includes("department event 1"));
    const dept2StatusIndexRaw = headers.findIndex(h => h.includes("dept event 2 status") || h.includes("dept event 2") || h.includes("department event 2"));

    // Fallbacks to default production columns (Columns U through [) if headers don't match
    const idIndex = idIndexRaw !== -1 ? idIndexRaw : 20; // Column U
    const nameIndex = nameIndexRaw !== -1 ? nameIndexRaw : 2; // Column C
    const statusIndex = statusIndexRaw !== -1 ? statusIndexRaw : 21; // Column V
    
    const commonEventIndex = commonEventIndexRaw !== -1 ? commonEventIndexRaw : 9; // Column J
    const workshopParticipationIndex = workshopParticipationIndexRaw !== -1 ? workshopParticipationIndexRaw : 10; // Column K
    const deptEventIndex = deptEventIndexRaw !== -1 ? deptEventIndexRaw : 11; // Column L

    const common1StatusIndex = common1StatusIndexRaw !== -1 ? common1StatusIndexRaw : 22; // Column W
    const common2StatusIndex = common2StatusIndexRaw !== -1 ? common2StatusIndexRaw : 23; // Column X
    const workshopStatusIndex = workshopStatusIndexRaw !== -1 ? workshopStatusIndexRaw : 24; // Column Y
    const dept1StatusIndex = dept1StatusIndexRaw !== -1 ? dept1StatusIndexRaw : 25; // Column Z
    const dept2StatusIndex = dept2StatusIndexRaw !== -1 ? dept2StatusIndexRaw : 26; // Column [

    let rowIndex = -1;
    let userData = null;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][idIndex] && rows[i][idIndex].toString().trim() === scannedId.toString().trim()) {
        rowIndex = i + 1;
        userData = {
          name: rows[i][nameIndex] || "Unknown Participant",
          status: rows[i][statusIndex] || "Pending",
        };
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ message: "Invalid Ticket: ID not found." });
    }

    const currentRow = rows[rowIndex - 1] || [];

    // Debug logs to trace columns
    console.log(`[postData API] category: ${category}, event: ${selectedEvent}`);
    console.log(`[postData API] commonEventIndex: ${commonEventIndex} ("${headers[commonEventIndex]}"), deptEventIndex: ${deptEventIndex} ("${headers[deptEventIndex]}")`);
    console.log(`[postData API] row common text: "${currentRow[commonEventIndex]}", row dept text: "${currentRow[deptEventIndex]}"`);

    // All event check-ins (except Main Gate) require Main Gate check-in first
    if (category !== "gate" && userData.status !== "Checked In") {
      return res.status(400).json({ message: "Access Denied: Must check in at Main Gate first.", name: userData.name });
    }

    if (category === "gate" || !category) {
      // Main Gate check-in
      if (userData.status === "Checked In") {
        return res.status(400).json({ message: "Main Gate Entry: Participant has already checked in at the Main Gate.", name: userData.name });
      }

      const colLetter = getColumnLetter(statusIndex);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["Checked In"]] },
      });

      return res.status(200).json({ message: "Main Gate Check-in Successful!", name: userData.name });

    } else if (category === "workshop") {
      // Workshop Check-in
      const targetWorkshop = selectedEvent || "Edge AI and TinyML for Intelligent IoT";
      const workshopRegistered = currentRow[workshopParticipationIndex] || "";

      if (workshopRegistered.toString().trim().toLowerCase() !== "yes") {
        return res.status(400).json({ message: `Access Denied: Not registered for Workshop.`, name: userData.name });
      }

      const workshopStatusVal = currentRow[workshopStatusIndex] || "";
      if (workshopStatusVal.toLowerCase() === "checked in" || workshopStatusVal.toLowerCase() === "yes" || workshopStatusVal.trim()) {
        return res.status(400).json({ message: `Workshop Check-in: Participant has already checked in for "${targetWorkshop}".`, name: userData.name });
      }

      const colLetter = getColumnLetter(workshopStatusIndex);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["Checked In"]] },
      });

      return res.status(200).json({ message: "Workshop Check-in Approved!", name: userData.name });

    } else if (category === "common") {
      // Common Event Check-in
      if (!selectedEvent) {
        return res.status(400).json({ message: "Please select an event." });
      }

      const registeredCommonText = currentRow[commonEventIndex] || "";
      const registeredCommons = registeredCommonText.split(",");
      const cleanTarget = cleanString(selectedEvent);

      const hasRegistered = registeredCommons.some(rc => cleanString(rc) === cleanTarget);

      if (!hasRegistered) {
        return res.status(400).json({ message: `Access Denied: Not registered for "${selectedEvent}".`, name: userData.name });
      }

      const common1Val = currentRow[common1StatusIndex] || "";
      const common2Val = currentRow[common2StatusIndex] || "";
      const cleanCommon1 = cleanString(common1Val);
      const cleanCommon2 = cleanString(common2Val);

      if (cleanCommon1 === cleanTarget || cleanCommon2 === cleanTarget) {
        return res.status(400).json({ message: `Common Event: Participant has already checked in for "${selectedEvent}".`, name: userData.name });
      }

      if (common1Val && common2Val) {
        return res.status(400).json({ message: "Common Event: Access Denied. Maximum of 2 Common Event check-ins reached for this participant.", name: userData.name });
      }

      const targetColIndex = !common1Val ? common1StatusIndex : common2StatusIndex;
      const colLetter = getColumnLetter(targetColIndex);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[selectedEvent]] },
      });

      return res.status(200).json({ message: `Approved for ${selectedEvent}!`, name: userData.name });

    } else if (category === "dept") {
      // Department Event Check-in
      if (!selectedEvent) {
        return res.status(400).json({ message: "Please select an event." });
      }

      const registeredDeptText = currentRow[deptEventIndex] || "";
      const registeredDepts = registeredDeptText.split(",");
      const cleanTarget = cleanString(selectedEvent);

      const hasRegistered = registeredDepts.some(rd => cleanString(rd) === cleanTarget);

      if (!hasRegistered) {
        return res.status(400).json({ message: `Access Denied: Not registered for "${selectedEvent}".`, name: userData.name });
      }

      const dept1Val = currentRow[dept1StatusIndex] || "";
      const dept2Val = currentRow[dept2StatusIndex] || "";
      const cleanDept1 = cleanString(dept1Val);
      const cleanDept2 = cleanString(dept2Val);

      if (cleanDept1 === cleanTarget || cleanDept2 === cleanTarget) {
        return res.status(400).json({ message: `Department Event: Participant has already checked in for "${selectedEvent}".`, name: userData.name });
      }

      if (dept1Val && dept2Val) {
        return res.status(400).json({ message: "Department Event: Access Denied. Maximum of 2 Department Event check-ins reached for this participant.", name: userData.name });
      }

      const targetColIndex = !dept1Val ? dept1StatusIndex : dept2StatusIndex;
      const colLetter = getColumnLetter(targetColIndex);
      
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${colLetter}${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[selectedEvent]] },
      });

      return res.status(200).json({ message: `Approved for ${selectedEvent}!`, name: userData.name });
    }

  } catch (error) {
    console.error("Error in postData API:", error);
    return res.status(500).json({ message: "Google Sheets error", error: error.message });
  }
}