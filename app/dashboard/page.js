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

  // Status message states for notifications
  const [notification, setNotification] = useState(null);

  const router = useRouter();
  const titleInputRef = useRef(null);

  // Authentication check
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

  // Show a notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Fetch Requests from Firestore
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "requests"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by date (descending) if date exists
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

  // Handle Form Submission (Create or Edit)
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

  // Enable Edit Mode
  const handleEdit = (item) => {
    setTitle(item.title || "");
    setDescription(item.description || "");
    setTopics(item.topics || "");
    setEditId(item.id);
    
    // Focus the title input field
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setTopics("");
    setEditId(null);
  };

  // Publish Request (Set published = true)
  const handlePublish = async (id) => {
    try {
      await updateDoc(doc(db, "requests", id), {
        published: true,
      });

      showNotification("Request published successfully to the public feed!");
      fetchRequests();
    } catch (error) {
      console.error("Error publishing request:", error);
      showNotification(error.message, "error");
    }
  };

  // Delete Request
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "requests", id));
      showNotification("Request deleted successfully", "info");

      // Reset form if current request being edited is deleted
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

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      showNotification("Logout failed: " + error.message, "error");
    }
  };

  // Dynamic Statistics
  const stats = {
    total: requests.length,
    published: requests.filter((r) => r.published).length,
    drafts: requests.filter((r) => !r.published).length,
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-400 text-sm font-medium animate-pulse">Loading Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-indigo-500/10 px-6 py-4 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/15">
              RS
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                RequestSphere
              </h1>
              <p className="text-xs text-gray-400">Workspace Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-gray-400">Signed in as</span>
              <span className="text-sm font-medium text-gray-200">{user?.email}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/request")}
                className="inline-flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Public Feed
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="max-w-6xl mx-auto px-4">
        {/* Floating Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm glass-panel p-4 rounded-xl border flex items-start gap-3 shadow-2xl animate-fade-in-up border-indigo-500/30">
            <div className="shrink-0 mt-0.5">
              {notification.type === "success" && (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {notification.type === "error" && (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {notification.type !== "success" && notification.type !== "error" && (
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Dashboard Statistics Widget */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 border border-indigo-500/10">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Total Requests</p>
              <h2 className="text-3xl font-extrabold text-gray-100 mt-0.5">{stats.total}</h2>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 border border-emerald-500/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Published</p>
              <h2 className="text-3xl font-extrabold text-emerald-400 mt-0.5">{stats.published}</h2>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 border border-amber-500/10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Pending Drafts</p>
              <h2 className="text-3xl font-extrabold text-amber-400 mt-0.5">{stats.drafts}</h2>
            </div>
          </div>
        </section>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Create/Edit Form */}
          <section className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 sticky top-28">
              <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {editId ? "Modify Request" : "New Request"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Request Title</label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    placeholder="Provide a short description..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Detailed Description</label>
                  <textarea
                    placeholder="Describe your request in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={4}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Topic tags</label>
                  <span className="block text-[10px] text-gray-500 mb-1.5">Separate multiple topics with commas</span>
                  <input
                    type="text"
                    placeholder="React, Nextjs, Backend"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    disabled={loading}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : editId ? (
                      "Update Request"
                    ) : (
                      "Create Request"
                    )}
                  </button>

                  {editId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20 text-sm font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Right Column: Requests List */}
          <section className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Workspace Feed
              </h3>
              <span className="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20 font-medium">
                {requests.length} Requests
              </span>
            </div>

            {loading && requests.length === 0 ? (
              <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
                <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-400 text-sm">Syncing requests database...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="glass-panel p-16 rounded-2xl text-center border-2 border-dashed border-indigo-500/15 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-400/40 mb-4 border border-indigo-500/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-200">No requests found</h4>
                <p className="text-gray-400 text-sm mt-1 max-w-xs">Create your very first request card using the control form on the left.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 border border-indigo-500/10 hover:border-indigo-500/25 transition-all duration-300 animate-fade-in-up"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {item.published ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Draft
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500">
                          {item.createdAt?.toDate
                            ? item.createdAt.toDate().toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "No Date"}
                        </span>
                      </div>

                      <h4 className="font-bold text-lg text-gray-100 truncate mb-1">
                        {item.title}
                      </h4>

                      <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {item.topics &&
                          item.topics
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .map((topic, i) => (
                              <span
                                key={i}
                                className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium"
                              >
                                {topic}
                              </span>
                            ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-indigo-500/5 pt-3 md:pt-0 md:border-t-0 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg transition cursor-pointer border border-indigo-500/15"
                        title="Edit Request"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {!item.published && (
                        <button
                          onClick={() => handlePublish(item.id)}
                          className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          title="Publish Request"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Publish
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer border border-red-500/15"
                        title="Delete Request"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

