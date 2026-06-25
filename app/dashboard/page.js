"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [requests, setRequests] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState(null);

  const router = useRouter();
  const titleInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "requests"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      showNotification("Failed to fetch requests: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !description.trim() || !topics.trim()) {
      showNotification("Please fill in all fields", "warning");
      return;
    }
   
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "requests", editId), {
          title: title.trim(),
          description: description.trim(),
          topics: topics.trim(),
        });

        showNotification("Request updated successfully!");
        setEditId(null);
      } else {
        await addDoc(collection(db, "requests"), {
          title: title.trim(),
          description: description.trim(),
          topics: topics.trim(),
          published: false,
          createdAt: new Date(),
        });

        showNotification("New request created successfully!");
      }

      setTitle("");
      setDescription("");
      setTopics("");
      fetchRequests();
    } catch (error) {
      console.error("Error submitting request:", error);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title || "");
    setDescription(item.description || "");
    setTopics(item.topics || "");
    setEditId(item.id);
    
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setTopics("");
    setEditId(null);
  };

  const handlePublish = async (id) => {
    try {
      await updateDoc(doc(db, "requests", id), {
        published: true,
      });

      showNotification("Request published successfully!");
      fetchRequests();
    } catch (error) {
      console.error("Error publishing request:", error);
      showNotification(error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "requests", id));
      showNotification("Request deleted successfully");

      if (id === editId) {
        setTitle("");
        setDescription("");
        setTopics("");
        setEditId(null);
      }

      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      showNotification(error.message, "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      showNotification("Logout failed: " + error.message, "error");
    }
  };

  const stats = {
    total: requests.length,
    published: requests.filter((r) => r.published).length,
    drafts: requests.filter((r) => !r.published).length,
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-800">
        <span className="text-gray-500 font-semibold">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Request Dashboard
            </h1>
            <p className="text-xs text-gray-500">Logged in: {user?.email}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/request")}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold transition cursor-pointer"
            >
              Public Feed
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-4">
        {/* Simple Notification Banner */}
        {notification && (
          <div className={`mb-6 p-3 rounded border text-sm ${
            notification.type === "error" 
              ? "bg-red-100 border-red-200 text-red-700" 
              : notification.type === "warning"
              ? "bg-amber-100 border-amber-200 text-amber-700"
              : "bg-blue-100 border-blue-200 text-blue-700"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Dynamic Statistics summary text */}
        <div className="mb-6 text-sm font-semibold text-gray-600">
          Total Requests: {stats.total} | Published: {stats.published} | Drafts: {stats.drafts}
        </div>

        {/* Input Form */}
        <section className="bg-white border border-gray-200 p-6 rounded-lg mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {editId ? "Edit Request" : "Create Request"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title
              </label>
              <input
                ref={titleInputRef}
                type="text"
                placeholder="Request Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 p-2 rounded text-black bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Description details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                className="w-full border border-gray-300 p-2 rounded text-black bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Topics (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, JavaScript, Firebase"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 p-2 rounded text-black bg-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition cursor-pointer"
              >
                {editId ? "Update Request" : "Submit Request"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2 rounded transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Requests List */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            All Requests
          </h3>

          {loading && requests.length === 0 ? (
            <div className="bg-white border border-gray-200 p-6 text-center rounded">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-gray-200 p-6 text-center text-gray-500 rounded">
              No requests found. Create a request using the form above.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.published ? (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold uppercase">
                          Published
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold uppercase">
                          Draft
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {item.createdAt?.toDate
                          ? item.createdAt.toDate().toLocaleDateString()
                          : "No Date"}
                      </span>
                    </div>

                    <h4 className="font-bold text-lg text-gray-900">
                      {item.title}
                    </h4>

                    <p className="text-gray-600 text-sm mt-1">
                      {item.description}
                    </p>

                    <p className="text-blue-600 text-xs mt-2 font-semibold">
                      Topics: {item.topics}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                    >
                      Edit
                    </button>

                    {!item.published && (
                      <button
                        onClick={() => handlePublish(item.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                      >
                        Publish
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


