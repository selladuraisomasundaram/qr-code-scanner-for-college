import React, { useState, useRef } from "react";
import { QrReader } from "react-qr-reader";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";

export default function Scan() {
  const router = useRouter();
  const [data, setData] = useState("No result");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrRef = useRef(null);

  const handleScan = (result, error) => {
    if (!!result) {
      setData(result?.text);
      setShowModal(true);
    }
    if (!!error) {
      console.info(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.reload();
  };

  const handleOK = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(`/api/postData`, { data });
      router.reload();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Scan Entry | Paavai Engineering College</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-red-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold">Entry Scanner</h1>
            <p className="text-red-100 text-sm">Align QR code within the frame</p>
          </div>
          
          <div className="p-8 flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden border-4 border-red-50 shadow-inner">
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: "environment" }}
                className="w-full h-full"
                ref={qrRef}
              />
              <div className="absolute inset-0 border-2 border-red-500 opacity-30 pointer-events-none animate-pulse"></div>
            </div>

            <Link
              href="/"
              className="mt-8 flex items-center text-gray-600 hover:text-red-600 transition-colors font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Code Detected</h3>
                <div className="bg-gray-50 rounded-lg p-3 mb-6 break-all">
                  <p className="text-gray-600 font-mono text-sm">{data}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    onClick={handleOK}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Confirm Entry"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}