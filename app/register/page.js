"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-indigo-400 animate-pulse text-sm font-medium">
        Redirecting to Sign Up...
      </div>
    </div>
  );
}

