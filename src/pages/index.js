import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Event Manager | Paavai Engineering College</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
              <img 
                src="/logo.jpg" 
                alt="Paavai Engineering College Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-orange-600 font-semibold tracking-wide uppercase text-sm">Event Entry Management</h2>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Paavai Engineering College <span className="text-orange-600">(Autonomous)</span>
              </h1>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Streamlined QR-based entry system for campus events and symposiums.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Link
              href="/scan"
              className="group relative flex flex-col items-center p-10 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-orange-100 w-full max-w-sm"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-800">Scan Entry</span>
              <p className="text-gray-500 text-base mt-2">Verify participant QR codes</p>
            </Link>
          </div>

          <footer className="pt-12 text-gray-400 text-sm">
            © {new Date().getFullYear()} Paavai Engineering College. All rights reserved.
          </footer>
        </div>
      </main>
    </>
  );
}