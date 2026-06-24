"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";

export default function RequestDetailsPage({ params }) {
  // Next.js 15+ compatible unwrapping for dynamic params Promise using React.use()
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push("/request")}
        className="mb-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
      >
        ← Back to Public Requests
      </button>

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
