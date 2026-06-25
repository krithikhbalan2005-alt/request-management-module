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

      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - 2 * margin; // 170mm

      // Simple Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 30);
      doc.text("Request Report", margin, 25);

      // Separator Line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 29, pageWidth - margin, 29);

      let currentY = 38;

      const addField = (label, val) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(label, margin, currentY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        const wrappedVal = doc.splitTextToSize(val || "N/A", contentWidth - 30);
        doc.text(wrappedVal, margin + 30, currentY);
        
        currentY += wrappedVal.length * 6 + 4;
      };

      addField("ID:", request.id);
      addField("Title:", request.title);
      addField("Topics:", request.topics);

      const dateStr = request.createdAt?.toDate
        ? request.createdAt.toDate().toLocaleString()
        : "No Date";
      addField("Created At:", dateStr);

      currentY += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text("Description:", margin, currentY);
      currentY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      const wrappedDesc = doc.splitTextToSize(request.description || "", contentWidth);
      doc.text(wrappedDesc, margin, currentY);

      const formatFilename = (title) => {
        if (!title) return "Request";
        return title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-");
      };

      const filename = `request-${formatFilename(request.title)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
          <button
            onClick={() => router.push("/request")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-sm font-semibold transition cursor-pointer"
          >
            ← Back
          </button>

          {request && !loading && !error && (
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded transition cursor-pointer"
            >
              Download PDF
            </button>
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


