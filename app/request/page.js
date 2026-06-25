"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function RequestPage() {
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Query Firestore directly for requests where published is true
      const q = query(collection(db, "requests"), where("published", "==", true));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically extract unique topics from the requests
  const allTopics = useMemo(() => {
    const topicsSet = new Set();
    requests.forEach((item) => {
      if (item.topics) {
        // If topics is a comma-separated string, split it.
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

  // Filter requests based on search query and selected topic in real time
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // 1. Topic Filter
      const matchesTopic =
        selectedTopic === "All" ||
        (item.topics &&
          item.topics
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .includes(selectedTopic.toLowerCase()));

      // 2. Search Filter (title, description, topics)
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Public Requests</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm"
        >
          ← Go to Dashboard
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by title, description, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
          />
        </div>

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px] text-sm text-gray-700 transition duration-200 cursor-pointer"
        >
          <option value="All">All Topics</option>
          {allTopics.map((topic, index) => (
            <option key={index} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No requests found</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Try adjusting your search keywords or choosing another topic.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 p-5 rounded-xl shadow-sm bg-white hover:shadow-md hover:border-blue-200 transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1 leading-snug truncate">
                  {item.title}
                </h2>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">
                    Topic: {item.topics}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-400">
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString()
                      : "No Date"}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/request/${item.id}`)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition duration-200 whitespace-nowrap self-end sm:self-center"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
