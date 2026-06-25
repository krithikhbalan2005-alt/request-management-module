"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateRequestPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-indigo-400 animate-pulse text-sm font-medium">
        Redirecting to dashboard...
      </div>
    </div>
  );
}