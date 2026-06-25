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

      // Title header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(33, 37, 41); // Dark charcoal
      doc.text("Request Details Report", margin, 25);

      // Horizontal separator line
      doc.setDrawColor(222, 226, 230); // Light gray
      doc.setLineWidth(0.5);
      doc.line(margin, 29, pageWidth - margin, 29);

      let currentY = 38;

      // Metadata section helpers
      const addField = (label, val, size = 11) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(73, 80, 87); // Soft dark gray
        doc.text(label, margin, currentY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(33, 37, 41);
        const wrappedVal = doc.splitTextToSize(val || "N/A", contentWidth - 30);
        doc.text(wrappedVal, margin + 30, currentY);
        
        currentY += wrappedVal.length * 6 + 4;
      };

      // Add simple metadata fields
      addField("Title:", request.title);
      addField("Topics:", request.topics);

      const dateStr = request.createdAt?.toDate
        ? request.createdAt.toDate().toLocaleString()
        : "No Date";
      addField("Created At:", dateStr);

      // Add description header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(73, 80, 87);
      doc.text("Description:", margin, currentY);
      currentY += 6;

      // Add description block content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(33, 37, 41);
      const wrappedDesc = doc.splitTextToSize(request.description || "", contentWidth);
      doc.text(wrappedDesc, margin, currentY);

      // Format dynamic filename: capitalize each word and join with hyphens (e.g. Printer-Issue.pdf)
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
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header Navigation Controls */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push("/request")}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
        >
          ← Back to Requests
        </button>

        {request && !loading && !error && (
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition font-semibold"
          >
            Download PDF
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 py-8 text-center text-lg animate-pulse">
          Loading request details...
        </div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 p-6 rounded-lg text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-lg">{error}</p>
        </div>
      ) : request ? (
        <div className="border p-6 rounded-lg shadow-md bg-white">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{request.title}</h1>
          
          <div className="border-t border-b py-4 my-4">
            <p className="text-gray-700 text-lg whitespace-pre-wrap leading-relaxed">
              {request.description}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-500">Topics:</span>{" "}
              <span className="inline-block bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded">
                {request.topics}
              </span>
            </div>

            <div className="text-gray-500">
              <span className="font-semibold">Created At:</span>{" "}
              {request.createdAt?.toDate
                ? request.createdAt.toDate().toLocaleString()
                : "No Date"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
