import { google } from "googleapis";
import axios from "axios";

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

  let publicErrorDetails = null;

  // 1. Try public direct fetch first (no GCP Drive API activation required)
  try {
    const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await axios({
      method: "get",
      url: publicUrl,
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      }
    });

    const contentType = response.headers["content-type"] || "";
    
    // If the response is HTML, it means Google Drive redirected to the login page (file is private).
    // Throw an error to trigger the catch block and fall back to the authenticated service account.
    if (contentType.includes("text/html")) {
      throw new Error("Google Drive redirected to the login page. The file is private.");
    }
    
    let finalContentType = contentType;
    if (contentType.includes("octet-stream") || !contentType) {
      finalContentType = "image/jpeg";
    }
    
    res.setHeader("Content-Type", finalContentType);
    res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");

    response.data.pipe(res);
    return;
  } catch (publicError) {
    publicErrorDetails = publicError.message;
    console.error(`[Proxy Debug] Public direct fetch failed for file ID ${fileId}:`, publicError.message);
  }

  // 2. Fallback to authenticated Google Drive API (requires Drive API enabled in GCP console)
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error("[Proxy Debug] Authenticated fallback skipped: Missing credentials in .env");
    return res.status(500).json({ 
      message: "Server configuration error: Missing API credentials.",
      publicError: publicErrorDetails
    });
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

    // Fetch file metadata
    let metadata;
    try {
      metadata = await drive.files.get({
        fileId,
        fields: "mimeType, name",
      });
    } catch (metaError) {
      console.error(`[Proxy Debug] Authenticated metadata fetch failed for file ID ${fileId}:`, metaError.message);
      return res.status(404).json({ 
        message: "File not found or access denied.", 
        error: metaError.message,
        publicError: publicErrorDetails,
        details: "Please ensure the Google Drive folder containing the uploaded photos is shared with the service account: " + process.env.GOOGLE_CLIENT_EMAIL
      });
    }

    const mimeType = metadata.data.mimeType || "image/jpeg";

    // Fetch the file media stream
    const fileResponse = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");

    fileResponse.data.pipe(res);
  } catch (error) {
    console.error("[Proxy Debug] Authenticated fallback failed:", error.message);
    return res.status(500).json({ 
      message: "Proxy error fetching image via authenticated fallback", 
      error: error.message,
      publicError: publicErrorDetails
    });
  }
}
