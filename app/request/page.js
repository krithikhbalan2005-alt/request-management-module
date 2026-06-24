"use client";

import { useEffect, useState, useMemo } from "react";
// Query மற்றும் where ஆகியவற்றை இறக்குமதி செய்துள்ளோம்
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function RequestPage() {
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // 1. Firestore-ல் இருந்தே நேரடியாக 'published: true' கொண்ட தரவுகளை மட்டும் எடுக்கிறோம் (Optimized Query)
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
      // 2. எந்த பிழை வந்தாலும் loading நிறுத்தப்படுவதை உறுதி செய்கிறோம்
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
      <h1 className="text-3xl font-bold mb-6">Public Requests</h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title, description, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
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
        <div className="text-gray-500 py-4 text-center">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-500 py-4 text-center border border-dashed rounded">
          No Published Requests Found
        </p>
      ) : (
        filteredRequests.map((item) => (
          <div key={item.id} className="border p-4 rounded mb-4 shadow-sm bg-white hover:shadow-md transition">
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p className="mt-2 text-gray-700">{item.description}</p>
            <p className="text-blue-600 mt-2 text-sm font-semibold">
              Topic: {item.topics}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {item.createdAt?.toDate
                ? item.createdAt.toDate().toLocaleString()
                : "No Date"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
