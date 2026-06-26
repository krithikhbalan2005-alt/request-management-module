"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, isMockConfig } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function RequestPage() {
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [localFallbackError, setLocalFallbackError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authInitialized) {
      fetchRequests();
    }
  }, [authInitialized]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const isMockMode = isMockConfig || sessionStorage.getItem("mockUser") !== null;
      console.log("[DEBUG] fetchRequests triggered. isMockMode:", isMockMode);
      
      if (isMockMode) {
        const localRequestsStr = localStorage.getItem("requests") || "[]";
        const localRequests = JSON.parse(localRequestsStr).filter((r) => r.published);
        localRequests.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        console.log("[DEBUG] Local storage requests count:", localRequests.length, localRequests);
        setRequests(localRequests);
        setLoading(false);
        return;
      }

      console.log("[DEBUG] Querying Firestore for published requests...");
      const q = query(collection(db, "requests"), where("published", "==", true));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("[DEBUG] Firestore query returned documents:", data.length, data);

      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
        return dateB - dateA;
      });

      setRequests(data);
    } catch (error) {
      console.error("[DEBUG] Error fetching requests:", error);
      setLocalFallbackError(error.message);
      // Fallback
      console.warn("[DEBUG] Falling back to local storage due to Firestore error...");
      const localRequestsStr = localStorage.getItem("requests") || "[]";
      const localRequests = JSON.parse(localRequestsStr).filter((r) => r.published);
      localRequests.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      setRequests(localRequests);
    } finally {
      setLoading(false);
    }
  };

  const allTopics = useMemo(() => {
    const topicsSet = new Set();
    requests.forEach((item) => {
      if (item.topics) {
        item.topics.split(",").forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) {
            topicsSet.add(trimmed);
          }
        });
      }
    });
    return Array.from(topicsSet).sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesTopic =
        selectedTopic === "All" ||
        (item.topics &&
          item.topics
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .includes(selectedTopic.toLowerCase()));

      const queryStr = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !queryStr ||
        (item.title && item.title.toLowerCase().includes(queryStr)) ||
        (item.description && item.description.toLowerCase().includes(queryStr)) ||
        (item.topics && item.topics.toLowerCase().includes(queryStr));

      return matchesTopic && matchesSearch;
    });
  }, [requests, searchQuery, selectedTopic]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-sm font-semibold transition cursor-pointer"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              Public Requests
            </h1>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-semibold transition cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-4">
        {localFallbackError && (
          <div className="mb-6 p-4 rounded border bg-amber-100 border-amber-200 text-amber-800 text-sm">
            <p className="font-bold mb-1">⚠️ Firebase Offline Fallback Mode Active</p>
            <p className="text-xs">
              The application failed to fetch requests from the real Firestore database and is currently reading/writing locally from your browser storage.
            </p>
            <p className="text-xs mt-1 font-semibold">
              Error details: {localFallbackError}
            </p>
          </div>
        )}
        {/* Simple Filters */}
        <section className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col md:flex-row gap-4 mb-8 shadow-sm">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search title, description, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded text-sm text-black bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full md:w-48 border border-gray-300 p-2.5 rounded text-sm text-black bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All">All Topics</option>
              {allTopics.map((topic, index) => (
                <option key={index} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Requests List */}
        {loading ? (
          <div className="bg-white border border-gray-200 p-12 text-center rounded">
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center text-gray-500 rounded">
            No public requests found.
          </div>
        ) : (
          <section className="space-y-4">
            {filteredRequests.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="text-xs text-gray-500">
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleString()
                        : item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "No Date"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100 flex-wrap">
                  <span className="text-xs text-blue-600 font-semibold">
                    Topics: {item.topics}
                  </span>

                  <button
                    onClick={() => router.push(`/request/${item.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded transition cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
