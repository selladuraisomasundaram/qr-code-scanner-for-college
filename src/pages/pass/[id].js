import { useRouter } from 'next/router';
import Head from 'next/head';
import QRCode from 'react-qr-code';
import Link from 'next/link';

export default function DigitalPass() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-pulse text-orange-600 font-medium text-lg">Loading your pass...</div>
    </div>
  );

  const shareToWhatsApp = () => {
    const url = window.location.href;
    const text = `Hi! Here is my entry pass for the Paavai Engineering College event. ID: ${id}\n\nView it here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadQR = () => {
    const svg = document.getElementById("QRCode");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `PEC-Pass-${id}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

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
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171c1.589.943 3.503 1.441 5.451 1.442 5.454 0 9.895-4.442 9.898-9.896.002-2.646-1.03-5.132-2.905-7.008-1.875-1.875-4.361-2.903-7.006-2.903-5.459 0-9.896 4.442-9.899 9.897-.001 2.123.543 4.191 1.574 5.997l-.998 3.648 3.735-.98z"/>
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