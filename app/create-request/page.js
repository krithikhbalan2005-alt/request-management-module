"use client";

import { useState } from "react";

export default function CreateRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg border p-6 rounded">
        <h1 className="text-2xl font-bold mb-4">
          Create Request
        </h1>

        <input
          type="text"
          placeholder="Request Title"
          className="w-full border p-2 mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="w-full border p-2 mb-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="text"
          placeholder="Topics Like To Learn"
          className="w-full border p-2 mb-3"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />

        <button className="w-full bg-black text-white p-2 rounded">
          Submit Request
        </button>
      </div>
    </div>
  );
}