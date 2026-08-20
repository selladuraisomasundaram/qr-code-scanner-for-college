import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredId, setRegisteredId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading("Registering participant...");

    try {
      const response = await axios.post("/api/register", formData);
      toast.success("Registration successful! Check your email.", { id: loadingToast });
      setRegisteredId(response.data.uniqueId);
      setFormData({ name: "", email: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Participant Registration | Paavai Engineering College</title>
      </Head>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-orange-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Event Registration</h1>
            <p className="text-orange-100 text-sm">Enter details to receive your digital pass</p>
          </div>

          {registeredId ? (
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Registration Complete!</h2>
                <p className="text-gray-500 mt-2">Your unique ID is <span className="font-mono font-bold text-orange-600">{registeredId}</span></p>
              </div>
              <div className="space-y-3">
                <Link
                  href={`/pass/${registeredId}`}
                  className="block w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg"
                >
                  View My Pass
                </Link>
                <button
                  onClick={() => setRegisteredId("")}
                  className="w-full text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Register Another Person
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full border-2 border-gray-100 focus:border-orange-500 focus:ring-0 p-4 rounded-xl transition-all outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full border-2 border-gray-100 focus:border-orange-500 focus:ring-0 p-4 rounded-xl transition-all outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Register & Get Pass"}
              </button>
              <Link
                href="/"
                className="block text-center text-gray-500 text-sm hover:text-orange-600 transition-colors"
              >
                Back to Dashboard
              </Link>
            </form>
          )}
        </div>
      </main>
    </>
  );
}