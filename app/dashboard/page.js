"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";

export default function Dashboard() {
  const [request, setRequest] = useState("");
  const [requests, setRequests] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Best Practice: Wrap in useCallback to prevent recreation on every render,
  // resolving React hooks ESLint warnings and avoiding potential infinite loops.
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "requests"));

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      alert("Failed to fetch requests: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!request.trim()) {
      alert("Enter Request");
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, "requests", editId), {
          request: request.trim(),
        });

        alert("Request Updated Successfully");
        setEditId(null);
      } else {
        await addDoc(collection(db, "requests"), {
          request: request.trim(),
          createdAt: new Date(),
        });

        alert("Request Saved Successfully");
      }

      setRequest("");
      fetchRequests();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(error.message);
    }
  };

  const handleEdit = (item) => {
    setRequest(item.request);
    setEditId(item.id);
  };

  const handleCancelEdit = () => {
    setRequest("");
    setEditId(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "requests", id));

      alert("Request Deleted");

      // Bug Fix: If the item currently being edited is deleted, reset the edit state.
      if (id === editId) {
        setRequest("");
        setEditId(null);
      }

      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Request Management Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="border p-4 rounded mb-6">
        <input
          type="text"
          placeholder="Enter Request"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            {editId ? "Update Request" : "Submit Request"}
          </button>
          {editId && (
            <button
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold mb-3">
        All Requests
      </h2>

      {loading && requests.length === 0 ? (
        <div className="text-gray-500 py-4 text-center">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500 py-4 text-center border border-dashed rounded">
          No requests found. Create a new request above.
        </div>
      ) : (
        requests.map((item) => (
          <div
            key={item.id}
            className="border p-3 rounded mb-3 flex justify-between items-center"
          >
            <span>{item.request}</span>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
