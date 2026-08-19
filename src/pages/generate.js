import Head from "next/head";
import { useState } from "react";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function Generate() {
  const [qrCodeValue, setQrCodeValue] = useState("");

  return (
    <>
      <Head>
        <title>Generate Pass | Paavai Engineering College</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-orange-500 p-6 text-white text-center flex flex-col items-center space-y-3">
            <div className="w-16 h-16 relative rounded-full overflow-hidden border-2 border-white/30 bg-white">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pass Generator</h1>
              <p className="text-orange-100 text-sm">Create entry codes for participants</p>
            </div>
          </div>

          <div className="p-8 flex flex-col items-center space-y-8">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participant Name or ID
              </label>
              <input
                className="w-full border-2 border-gray-100 focus:border-orange-500 focus:ring-0 p-4 rounded-xl transition-all outline-none text-lg"
                onChange={(e) => setQrCodeValue(e.target.value)}
                placeholder="Enter details here..."
                value={qrCodeValue}
              />
            </div>

            <div className="relative group">
              {qrCodeValue ? (
                <div className="p-6 bg-white rounded-2xl shadow-lg border border-orange-50 group-hover:scale-105 transition-transform duration-300">
                  <QRCode 
                    value={qrCodeValue} 
                    size={200}
                    level="H"
                    className="mx-auto"
                  />
                </div>
              ) : (
                <div className="w-[248px] h-[248px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p className="text-sm">QR will appear here</p>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-orange-600 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}