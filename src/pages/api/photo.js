import { google } from "googleapis";

const getFileIdFromUrl = (urlOrId) => {
  if (!urlOrId) return null;
  const str = urlOrId.toString().trim();
  
  // If it looks like a clean Google Drive file ID already
  if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) {
    return str;
  }
  
  // Match /file/d/FILE_ID
  const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }
  
  // Match ?id=FILE_ID or &id=FILE_ID
  const matchIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }
  
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: "Photo URL is required" });
  }

  const fileId = getFileIdFromUrl(url);

  if (!fileId) {
    return res.status(400).json({ message: "Invalid Google Drive file URL or ID format." });
  }

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return res.status(500).json({ message: "Server configuration error: Missing API credentials." });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 1. Fetch file metadata to determine the image type
    let metadata;
    try {
      metadata = await drive.files.get({
        fileId,
        fields: "mimeType, name",
      });
    } catch (metaError) {
      console.error(`Metadata fetch failed for file ID ${fileId}:`, metaError.message);
      return res.status(404).json({ 
        message: "File not found or access denied.", 
        details: "Please ensure the Google Drive folder containing the uploaded photos is shared with the service account: " + process.env.GOOGLE_CLIENT_EMAIL
      });
    }

    const mimeType = metadata.data.mimeType || "image/jpeg";

    // 2. Fetch the file media stream
    const fileResponse = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    // 3. Set headers for CORS and caching (cache for 1 day)
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // 4. Pipe the image stream directly to the response
    fileResponse.data.pipe(res);
  } catch (error) {
    console.error("Error in photo proxy API:", error);
    return res.status(500).json({ message: "Proxy error fetching image", error: error.message });
  }
}
