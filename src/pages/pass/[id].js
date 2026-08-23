import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import axios from 'axios';

export default function DigitalPass() {
  const router = useRouter();
  const { id } = router.query;

  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchParticipant = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/getParticipant?id=${id}`);
        setParticipant(response.data);
        setError(null);

        // Background diagnostic check to print photo load issues directly to the browser console
        if (response.data && response.data.photoUrl) {
          axios.get(`/api/photo?url=${encodeURIComponent(response.data.photoUrl)}`)
            .catch(photoErr => {
              console.error("====== DIGITAL PASS: PHOTO LOAD ERROR ======");
              console.error("Status Code:", photoErr.response?.status || "Unknown");
              console.error("Error Payload:", photoErr.response?.data || photoErr.message);
              console.error("Suggestion: If it is a 404, check that your Google Drive folder is shared publicly or that the Google Drive API is enabled in your Google Cloud Console project.");
              console.error("=============================================");
            });
        }
      } catch (err) {
        console.error("Failed to load participant details:", err);
        setError(err.response?.data?.message || "Invalid or missing Entry ID.");
      } finally {
        setLoading(false);
      }
    };

    fetchParticipant();
  }, [id]);

  const shareToWhatsApp = () => {
    const url = window.location.href;
    const text = `Hi! Here is my entry pass for the Paavai Engineering College event. ID: ${id}\n\nView it here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadQR = () => {
    const svg = document.getElementById("QRCode");
    if (!svg) return;

    // Clone the SVG and set explicit width/height to prevent scaling distortion when drawn on Canvas
    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute("width", "256");
    svgClone.setAttribute("height", "256");

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const qrSrc = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));

    const loadImage = (src, isCrossOrigin = false) => {
      return new Promise((resolve) => {
        const img = new Image();
        if (isCrossOrigin) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const drawRoundRect = (ctx, x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const imagePromises = [
      loadImage("/logo.jpg", true),
      loadImage(qrSrc)
    ];

    if (participant && participant.photoUrl) {
      imagePromises.push(loadImage(`/api/photo?url=${encodeURIComponent(participant.photoUrl)}`, true));
    } else {
      imagePromises.push(Promise.resolve(null));
    }

    Promise.all(imagePromises).then(([logoImg, qrImg, photoImg]) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set dimension for expanded height to fit photo and details nicely
      canvas.width = 600;
      canvas.height = 1010;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw Card Base
      ctx.save();
      ctx.fillStyle = "#ffffff";
      drawRoundRect(ctx, 0, 0, 600, 1010, 32);
      ctx.fill();
      ctx.clip();

      // Draw Header Background
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(0, 0, 600, 260);

      // Draw Logo Circle with Shadow
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(300, 90, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Draw Logo Image
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(300, 90, 45, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, 255, 45, 90, 90);
        ctx.restore();
      }

      // Draw Header Text
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("Official Event Pass", 300, 175);

      ctx.fillStyle = "#ffedd5";
      ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
      ctx.fillText("PAAVAI ENGINEERING COLLEGE", 300, 215);

      ctx.restore();

      // Draw Participant Photo
      ctx.save();
      // Draw circular container border
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(300, 350, 60, 0, Math.PI * 2);
      ctx.stroke();

      if (photoImg) {
        // Clip to a circle
        ctx.beginPath();
        ctx.arc(300, 350, 58, 0, Math.PI * 2);
        ctx.clip();

        // Object-fit cover cropping calculations
        const size = 116;
        const x = 300 - 58;
        const y = 350 - 58;

        const imgRatio = photoImg.width / photoImg.height;
        let sWidth = photoImg.width;
        let sHeight = photoImg.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > 1) {
          sWidth = photoImg.height;
          sx = (photoImg.width - sWidth) / 2;
        } else {
          sHeight = photoImg.width;
          sy = (photoImg.height - sHeight) / 2;
        }

        ctx.drawImage(photoImg, sx, sy, sWidth, sHeight, x, y, size, size);
      } else {
        // Draw beautiful slate and grey silhouette avatar placeholder on the Canvas
        ctx.fillStyle = "#f3f4f6"; // Slate-100 background
        ctx.beginPath();
        ctx.arc(300, 350, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#9ca3af"; // Gray-400 silhouette color
        // Draw head circle
        ctx.beginPath();
        ctx.arc(300, 335, 20, 0, Math.PI * 2);
        ctx.fill();
        // Draw shoulders arc
        ctx.beginPath();
        ctx.arc(300, 395, 40, Math.PI, 0); // half circle pointing up
        ctx.fill();
      }
      ctx.restore();

      // Draw Participant Name
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(participant?.name || "Participant Name", 300, 440);

      // Draw Participant Department
      if (participant?.department) {
        ctx.fillStyle = "#ea580c";
        ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
        ctx.fillText(participant.department.toUpperCase(), 300, 470);
      }

      // Draw QR Code Container Box
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#fff7ed";
      ctx.lineWidth = 4;
      drawRoundRect(ctx, 175, 510, 250, 250, 20);
      ctx.fill();
      ctx.stroke();

      // Draw QR Code
      if (qrImg) {
        ctx.drawImage(qrImg, 190, 525, 220, 220);
      }

      // Draw Unique Entry ID Block
      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText("UNIQUE ENTRY ID", 300, 790);

      ctx.fillStyle = "#f9fafb";
      ctx.strokeStyle = "#f3f4f6";
      ctx.lineWidth = 2;
      drawRoundRect(ctx, 100, 815, 400, 60, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 20px monospace";
      ctx.fillText(id, 300, 845);

      // Draw Footer Text
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      ctx.fillText("Please present this QR code at the entry gate for verification.", 300, 915);

      ctx.fillText(`© ${new Date().getFullYear()} Paavai Engineering College`, 300, 955);

      // Trigger Download
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `PEC-Pass-${id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-pulse text-orange-600 font-medium text-lg">Loading your pass...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Entry Pass</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Your Event Pass | Paavai Engineering College</title>
      </Head>

      <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-orange-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden border-2 border-white/20">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold">Official Event Pass</h1>
          <p className="text-orange-100 text-xs uppercase tracking-widest font-medium">Paavai Engineering College</p>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          {/* Participant Photo & Details */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full overflow-hidden border-4 border-orange-500/20 shadow-md mb-3 flex items-center justify-center">
              {participant?.photoUrl && !imageError ? (
                <img
                  src={`/api/photo?url=${encodeURIComponent(participant.photoUrl)}`}
                  alt={participant.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-gray-800">{participant?.name || "Participant"}</h2>
            {participant?.department && (
              <p className="text-sm text-orange-600 font-bold uppercase tracking-wider mt-1.5">{participant.department}</p>
            )}
          </div>

          <div className="p-4 bg-white border-2 border-orange-50 rounded-2xl mb-6 shadow-inner">
            <QRCode
              id="QRCode"
              value={id}
              size={200}
              level="H"
              className="mx-auto"
            />
          </div>

          <div className="mb-8">
            <p className="text-gray-400 text-xs uppercase font-bold mb-1 tracking-wider">Unique Entry ID</p>
            <p className="text-2xl font-mono font-bold text-gray-800 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{id}</p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={downloadQR}
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Pass
            </button>

            <button
              onClick={shareToWhatsApp}
              className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171c1.589.943 3.503 1.441 5.451 1.442 5.454 0 9.895-4.442 9.898-9.896.002-2.646-1.03-5.132-2.905-7.008-1.875-1.875-4.361-2.903-7.006-2.903-5.459 0-9.896 4.442-9.899 9.897-.001 2.123.543 4.191 1.574 5.997l-.998 3.648 3.735-.98z" />
              </svg>
              Share to WhatsApp
            </button>
          </div>

          <p className="mt-6 text-gray-400 text-[10px] leading-relaxed">
            Please present this QR code at the entry gate for verification.
          </p>
        </div>
      </div>

      <footer className="mt-8 text-gray-400 text-xs flex flex-col items-center gap-2">
        <p>© {new Date().getFullYear()} Paavai Engineering College</p>
      </footer>
    </div>
  );
}