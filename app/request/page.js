"use client";

import { useState } from "react";

export default function RequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    alert("Request Submitted");
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Create Request</h1>

      <input
        type="text"
        placeholder="Request Title"
        className="border p-2 w-full mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Description"
        className="border p-2 w-full mb-3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Submit Request
      </button>
    </div>
  );
}