import React, { useState, useRef, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Scan() {
  const router = useRouter();
  const [data, setData] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, submitting, success
  const [participantName, setParticipantName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const qrRef = useRef(null);

  // Role and Event verification states
  const [role, setRole] = useState("volunteer");
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customEvent, setCustomEvent] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setAuthorized(true);

    const activeRole = localStorage.getItem("role") || "volunteer";
    setRole(activeRole);

    if (activeRole === "event_manager") {
      // Load saved department selection
      const storedDept = localStorage.getItem("selectedDepartment") || "";
      setSelectedDepartment(storedDept);

      // Load saved event selection from localStorage
      const storedEvent = localStorage.getItem("selectedEvent");
      if (storedEvent) {
        if (storedEvent.startsWith("custom:")) {
          const val = storedEvent.replace("custom:", "");
          setIsCustom(true);
          setSelectedEvent("custom");
          setCustomEvent(val);
        } else {
          setSelectedEvent(storedEvent);
        }
      }

      // Fetch dynamic departments and events map from Google Sheet
      async function fetchEvents() {
        setIsLoadingEvents(true);
        try {
          const response = await axios.get("/api/postData");
          if (response.data.departments) {
            setDepartmentsMap(response.data.departments);
            
            // Populate events list based on loaded department selection
            if (storedDept && response.data.departments[storedDept]) {
              setEvents(response.data.departments[storedDept]);
            }
          }
        } catch (err) {
          console.error("Failed to load events:", err);
          toast.error("Could not load event mapping from spreadsheet.");
        } finally {
          setIsLoadingEvents(false);
        }
      }
      fetchEvents();
    }
  }, [router]);

  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
    localStorage.setItem("selectedDepartment", dept);
    
    // Clear event selection when department changes
    setSelectedEvent("");
    localStorage.removeItem("selectedEvent");
    setIsCustom(false);
    
    if (dept && departmentsMap[dept]) {
      setEvents(departmentsMap[dept]);
    } else {
      setEvents([]);
    }
  };

  const handleEventChange = (val) => {
    setSelectedEvent(val);
    if (val === "custom") {
      setIsCustom(true);
      localStorage.setItem("selectedEvent", `custom:${customEvent}`);
    } else {
      setIsCustom(false);
      localStorage.setItem("selectedEvent", val);
    }
  };

  const handleCustomEventChange = (val) => {
    setCustomEvent(val);
    localStorage.setItem("selectedEvent", `custom:${val}`);
  };

  const handleScan = (result, error) => {
    if (!!result && status === "idle") {
      setData(result?.text);
      setShowModal(true);
    }
    if (!!error) {
      console.info(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setStatus("idle");
    setData("");
  };

  const handleOK = async () => {
    setStatus("submitting");
    const loadingToast = toast.loading("Verifying ticket...");
    const eventToSend = role === "event_manager"
      ? (isCustom ? customEvent : selectedEvent)
      : undefined;

    if (role === "event_manager" && !selectedDepartment) {
      toast.error("Please select the department first!", { id: loadingToast });
      setStatus("idle");
      return;
    }

    if (role === "event_manager" && !eventToSend) {
      toast.error("Please select or enter the event you are managing!", { id: loadingToast });
      setStatus("idle");
      return;
    }
    
    try {
      const response = await axios.post(`/api/postData`, { 
        data,
        event: eventToSend
      });
      const successMessage = eventToSend 
        ? `Check-in approved for ${eventToSend}!`
        : "Check-in successful!";
      toast.success(successMessage, { id: loadingToast });
      setParticipantName(response.data.name);
      setStatus("success");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to verify ticket";
      toast.error(errorMessage, { id: loadingToast });
      setStatus("idle");
      if (err.response?.status === 400) {
        setShowModal(false);
      }
    }
  };

  if (!authorized) return null;

  return (
    <>
      <Head>
        <title>Scan Entry | Paavai Engineering College</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-red-600 p-6 text-white text-center flex flex-col items-center space-y-3">
            <div className="w-16 h-16 relative rounded-full overflow-hidden border-2 border-white/30 bg-white">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Entry Scanner</h1>
              <p className="text-red-100 text-sm">Align QR code within the frame</p>
            </div>
          </div>
          
          <div className="p-8 flex flex-col items-center">
            {/* Event Selector - Only shown to Event Managers */}
            {role === "event_manager" && (
              <>
                {/* Department Selector */}
                <div className="w-full mb-4 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Organizing Department
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full border-2 border-gray-100 focus:border-red-500 focus:ring-0 p-3.5 rounded-xl transition-all outline-none text-gray-700 bg-white"
                    >
                      <option value="">-- Choose Department --</option>
                      {isLoadingEvents ? (
                        <option disabled>Loading departments...</option>
                      ) : (
                        Object.keys(departmentsMap).map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Event Selector */}
                <div className="w-full mb-6 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Verification Venue / Event
                  </label>
                  <div className="relative">
                    <select
                      value={selectedEvent}
                      onChange={(e) => handleEventChange(e.target.value)}
                      disabled={!selectedDepartment}
                      className="w-full border-2 border-gray-100 focus:border-red-500 focus:ring-0 p-3.5 rounded-xl transition-all outline-none text-gray-700 bg-white disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedDepartment ? "-- Select Department First --" : "-- Choose Event --"}
                      </option>
                      {isLoadingEvents ? (
                        <option disabled>Loading events from sheet...</option>
                      ) : (
                        events.map((evt) => (
                          <option key={evt} value={evt}>
                            Event Hall: {evt}
                          </option>
                        ))
                      )}
                      <option value="custom">Custom/Other Event...</option>
                    </select>
                  </div>

                {isCustom && (
                  <input
                    type="text"
                    placeholder="Enter custom event name"
                    value={customEvent}
                    onChange={(e) => handleCustomEventChange(e.target.value)}
                    className="w-full border-2 border-gray-100 focus:border-red-500 focus:ring-0 p-3.5 rounded-xl transition-all outline-none text-gray-700 mt-2"
                  />
                )}
              </div>
              </>
            )}

            <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden border-4 border-red-50 shadow-inner bg-black">
              {status === "idle" && (
                <QrReader
                  onResult={handleScan}
                  constraints={{ facingMode: "environment" }}
                  className="w-full h-full"
                  ref={qrRef}
                />
              )}
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
                {status === "success" ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h3>
                    <p className="text-green-600 font-semibold mb-4">{participantName}</p>
                    <p className="text-gray-500 mb-8">Entry has been successfully recorded in the system.</p>
                    <div className="flex flex-col gap-3">
                      <button
                        className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
                        onClick={() => router.push("/")}
                      >
                        Go to Dashboard
                      </button>
                      <button
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setShowModal(false);
                          setStatus("idle");
                          setData("");
                        }}
                      >
                        Scan Another
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Entry</h3>
                    <div className="bg-gray-50 rounded-lg p-3 mb-6 break-all">
                      <p className="text-gray-600 font-mono text-sm">{data}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                        onClick={handleCloseModal}
                        disabled={status === "submitting"}
                      >
                        Cancel
                      </button>
                      <button
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        onClick={handleOK}
                        disabled={status === "submitting"}
                      >
                        {status === "submitting" ? "Saving..." : "Confirm"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}