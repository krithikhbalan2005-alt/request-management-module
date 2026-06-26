"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
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

  const sanitizeForPDF = (text) => {
    if (!text) return "";
    return text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .split("")
      .map((char) => (char.charCodeAt(0) <= 255 ? char : "?"))
      .join("");
  };

  const handleDownloadPDF = () => {
    if (!request) return;

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - 2 * margin; // 170mm

      // Simple Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(30, 30, 30);
      pdf.text("Request Report", margin, 25);

      // Separator Line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 29, pageWidth - margin, 29);

      let currentY = 38;

      const addField = (label, val) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(80, 80, 80);
        pdf.text(label, margin, currentY);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(20, 20, 20);
        const wrappedVal = pdf.splitTextToSize(sanitizeForPDF(val) || "N/A", contentWidth - 30);
        pdf.text(wrappedVal, margin + 30, currentY);
        
        currentY += wrappedVal.length * 6 + 4;
      };

      addField("ID:", request.id);
      addField("Title:", request.title);
      addField("Topics:", request.topics);

      const dateStr = request.createdAt?.toDate
        ? request.createdAt.toDate().toLocaleString()
        : typeof request.createdAt === "string"
        ? new Date(request.createdAt).toLocaleString()
        : "No Date";
      addField("Created At:", dateStr);

      currentY += 4;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      pdf.text("Description:", margin, currentY);
      currentY += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(20, 20, 20);
      const wrappedDesc = pdf.splitTextToSize(sanitizeForPDF(request.description) || "", contentWidth);
      pdf.text(wrappedDesc, margin, currentY);

      const formatFilename = (title) => {
        if (!title) return "report";
        const cleaned = title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        return cleaned || "report";
      };

      const filename = `request-${formatFilename(request.title)}.pdf`;
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8 no-print">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
          <button
            onClick={() => router.push("/request")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-sm font-semibold transition cursor-pointer"
          >
            ← Back
          </button>

          {request && !loading && !error && (
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded transition cursor-pointer"
              >
                Print / Save PDF
              </button>

              <button
                onClick={handleDownloadPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded transition cursor-pointer"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Details Panel */}
      <main className="max-w-3xl mx-auto px-4">
        {loading ? (
          <div className="bg-white border border-gray-200 p-12 text-center rounded">
            Loading details...
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 p-8 rounded text-center text-red-700">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        ) : request ? (
          <div className="bg-white border border-gray-200 p-6 rounded shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <span className="text-xs text-gray-500">
                Created: {request.createdAt?.toDate
                  ? request.createdAt.toDate().toLocaleString()
                  : typeof request.createdAt === "string"
                  ? new Date(request.createdAt).toLocaleString()
                  : "No Date"}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase">
                Published
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {request.title}
            </h2>
            
            <div className="border border-gray-100 p-4 rounded bg-gray-50 mb-6 text-gray-700 text-sm whitespace-pre-wrap">
              {request.description}
            </div>

            <div className="text-sm font-semibold text-gray-600">
              Topics: <span className="text-blue-600 font-bold">{request.topics}</span>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}


