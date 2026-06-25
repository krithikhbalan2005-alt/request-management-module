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

      // Sort by date (newest first)
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });

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
    <div className="min-h-screen pb-16">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-indigo-500/10 px-6 py-4 mb-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/15 flex items-center justify-center transition cursor-pointer"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                Public Feed
              </h1>
              <p className="text-xs text-gray-400">View and download reports</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Page Content Container */}
      <main className="max-w-5xl mx-auto px-4">
        {/* Search & Filter Bar */}
        <section className="glass-panel p-4 rounded-2xl border border-indigo-500/10 flex flex-col md:flex-row gap-4 mb-8 animate-fade-in-up">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search request title, content, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-sm"
            />
          </div>

          <div className="relative shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full md:w-48 glass-input pl-10 pr-8 py-3 rounded-xl text-sm appearance-none cursor-pointer"
            >
              <option value="All" className="bg-[#0f111c] text-gray-200">All Topics</option>
              {allTopics.map((topic, index) => (
                <option key={index} value={topic} className="bg-[#0f111c] text-gray-200">
                  {topic}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </section>

        {/* Request Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm font-medium">Fetching public feed...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <section className="glass-panel p-16 rounded-2xl text-center border-2 border-dashed border-indigo-500/15 flex flex-col items-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-400/40 mb-4 border border-indigo-500/10">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-200">No public requests found</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-sm">
              We couldn't find any published requests matching your filter or search keywords.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            {filteredRequests.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-6 rounded-2xl border border-indigo-500/10 hover:border-indigo-500/25 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="text-[11px] text-gray-500 bg-indigo-500/5 px-2.5 py-0.5 rounded-md border border-indigo-500/10">
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "No Date"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-100 mb-2 leading-snug truncate" title={item.title}>
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-indigo-500/5">
                  <div className="flex flex-wrap gap-1">
                    {item.topics &&
                      item.topics
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 3) // Max 3 badges visible
                        .map((topic, i) => (
                          <span
                            key={i}
                            className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                  </div>

                  <button
                    onClick={() => router.push(`/request/${item.id}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                  >
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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

