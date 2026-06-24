"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function RequestPage() {
const [requests, setRequests] = useState([]);

useEffect(() => {
fetchRequests();
}, []);

const fetchRequests = async () => {
const querySnapshot = await getDocs(collection(db, "requests"));

```
const data = querySnapshot.docs
  .map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  .filter((item) => item.published === true);

setRequests(data);
```

};

return ( <div className="p-6 max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">
Public Requests </h1>

```
  {requests.length === 0 ? (
    <p>No Published Requests Found</p>
  ) : (
    requests.map((item) => (
      <div
        key={item.id}
        className="border p-4 rounded mb-4"
      >
        <h2 className="text-xl font-bold">
          {item.title}
        </h2>

        <p className="mt-2">
          {item.description}
        </p>

        <p className="text-blue-600 mt-2">
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