"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FileUploader } from "@/components/chat/file-uploader";

export default function Home() {
  const { session } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Immediate check - redirects instantly if not logged in
    if (session === null) {
      router.replace("/login"); 
    }
  }, [session, router]);

  // 1. Loading State (Session is being fetched)
  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">
        Loading...
      </div>
    );
  }

  // 2. Logged Out State (Don't render anything, useEffect handles redirect)
  if (!session) return null;

  // 3. Logged In State (Render the App)
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Chat with your PDF
          </h1>
          <p className="text-lg text-slate-600">
            Upload a document and start asking questions instantly using AI.
          </p>
        </div>
        <FileUploader />
      </div>
    </div>
  );
}