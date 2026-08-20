import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "react-hot-toast";

export default function Login() {
  const [role, setRole] = useState("volunteer"); // volunteer or event_manager
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (role === "volunteer") {
      if (username === "Paavai" && password === "Pec@123") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", "volunteer");
        toast.success("Volunteer login successful!");
        router.push("/");
      } else {
        toast.error("Invalid Volunteer credentials");
      }
    } else {
      if (username === "Paavai" && password === "Pec@123") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", "event_manager");
        toast.success("Event Manager login successful!");
        router.push("/");
      } else {
        toast.error("Invalid Event Manager credentials");
      }
    }
  };

  return (
    <>
      <Head>
        <title>{role === "volunteer" ? "Volunteer Login" : "Event Manager Login"} | Paavai Engineering College</title>
      </Head>
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-orange-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Campus Entry System</h1>
            <p className="text-orange-100 text-sm">Select role and sign in to continue</p>
          </div>

          <div className="flex p-4 border-b border-gray-100 bg-gray-50 gap-2">
            <button
              type="button"
              onClick={() => {
                setRole("volunteer");
                setUsername("");
                setPassword("");
              }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                role === "volunteer"
                  ? "bg-white text-orange-600 shadow-md scale-105"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("event_manager");
                setUsername("");
                setPassword("");
              }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                role === "event_manager"
                  ? "bg-white text-orange-600 shadow-md scale-105"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Event Manager
            </button>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                required
                className="w-full border-2 border-gray-100 focus:border-orange-500 focus:ring-0 p-4 rounded-xl transition-all outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., Paavai"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full border-2 border-gray-100 focus:border-orange-500 focus:ring-0 p-4 rounded-xl transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg active:scale-95"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </main>
    </>
  );
}