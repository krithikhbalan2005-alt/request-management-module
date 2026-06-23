"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login Successful");
  } catch (error) {
    alert(error.message);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md border p-6 rounded">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

       <button
  onClick={handleLogin}
  className="w-full bg-black text-white p-2 rounded"
>
  Login
</button>
      </div>
    </div>
  );
}