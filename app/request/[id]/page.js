"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

export default function RequestDetailsPage({ params }) {
  // Next.js 15+ requires unwrapping params Promise using React.use()
  const { id } = use(params);
  const router = useRouter();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, "requests", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRequest({
          id: docSnap.id,
          ...docSnap.data(),
        });
      } else {
        setError("Request Not Found");
      }
    } catch (err) {
      console.error("Error fetching request details:", err);
      setError("Failed to fetch request details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!request) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Page configuration helper variables
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - 2 * margin; // 170mm

      // Header Brand Accent Line
      doc.setFillColor(99, 102, 241); // Indigo color
      doc.rect(margin, 20, contentWidth, 2, "F");

      // Title header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Request Details Report", margin, 32);

      // Subtitle info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Report ID: ${request.id}`, margin, 38);

      // Horizontal separator line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, 42, pageWidth - margin, 42);

      let currentY = 52;

      // Metadata section helpers
      const addField = (label, val, size = 11) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text(label, margin, currentY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42); // Slate-900
        const wrappedVal = doc.splitTextToSize(val || "N/A", contentWidth - 30);
        doc.text(wrappedVal, margin + 30, currentY);
        
        currentY += wrappedVal.length * 6 + 6;
      };

      // Add simple metadata fields
      addField("Title:", request.title);
      addField("Topics:", request.topics);

      const dateStr = request.createdAt?.toDate
        ? request.createdAt.toDate().toLocaleString()
        : "No Date";
      addField("Created At:", dateStr);

      // Spacer
      currentY += 4;

      // Add description header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text("Detailed Description:", margin, currentY);
      currentY += 8;

      // Add description block content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      const wrappedDesc = doc.splitTextToSize(request.description || "", contentWidth);
      
      // Handle multi-line page overflow if description is very long
      wrappedDesc.forEach((line) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, margin, currentY);
        currentY += 6;
      });

      // Footer stamp
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("Generated automatically via RequestSphere Management System", margin, 282);

      // Format dynamic filename
      const formatFilename = (title) => {
        if (!title) return "Request";
        return title
          .trim()
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("-")
          .replace(/[^a-zA-Z0-9-]/g, ""); // Keep alphanumeric and hyphens
      };

      const filename = `${formatFilename(request.title)}.pdf`;

      // Save PDF to browser
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-indigo-500/10 px-6 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/request")}
              className="w-10 h-10 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/15 flex items-center justify-center transition cursor-pointer"
              title="Back to Public Feed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                Detail Report
              </h1>
              <p className="text-xs text-gray-400">Request analysis & details</p>
            </div>
          </div>

          {request && !loading && !error && (
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          )}
        </div>
      </header>

      {/* Main Details Panel */}
      <main className="max-w-3xl mx-auto px-4">
        {loading ? (
          <div className="glass-panel p-20 rounded-2xl flex flex-col items-center justify-center gap-4 text-center animate-pulse">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm font-medium">Loading report content...</p>
          </div>
        ) : error ? (
          <div className="glass-panel border-red-500/20 bg-red-500/5 text-red-300 p-8 rounded-2xl text-center shadow-lg animate-fade-in-up flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-200">Unable to load report</h2>
              <p className="text-gray-400 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => router.push("/request")}
              className="mt-2 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-xl transition font-semibold cursor-pointer"
            >
              Back to Feed
            </button>
          </div>
        ) : request ? (
          <div className="glass-panel p-8 rounded-2xl border border-indigo-500/10 shadow-xl animate-fade-in-up">
            {/* Meta Tags */}
            <div className="flex items-center justify-between gap-4 mb-6 border-b border-indigo-500/5 pb-6">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {request.createdAt?.toDate
                  ? request.createdAt.toDate().toLocaleString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "No Date"}
              </span>

              <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold">
                Published Request
              </span>
            </div>

            {/* Document Title */}
            <h2 className="text-3xl font-extrabold text-gray-100 mb-6 leading-tight">
              {request.title}
            </h2>
            
            {/* Description Block */}
            <div className="bg-slate-950/40 border border-indigo-500/5 p-6 rounded-xl mb-8">
              <p className="text-gray-300 text-base whitespace-pre-wrap leading-relaxed">
                {request.description}
              </p>
            </div>

            {/* Topics badge container */}
            <div className="flex items-center gap-3 text-sm border-t border-indigo-500/5 pt-6">
              <span className="font-semibold text-gray-400">Topics Tags:</span>
              <div className="flex flex-wrap gap-2">
                {request.topics &&
                  request.topics
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((topic, i) => (
                      <span
                        key={i}
                        className="inline-block bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold px-3 py-0.5 rounded-full text-xs"
                      >
                        {topic}
                      </span>
                    ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

