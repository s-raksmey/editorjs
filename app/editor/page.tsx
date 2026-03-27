"use client";

import { TokenAuth } from "@/components/auth-token/auth-token";
import { sessionStore } from "@/lib/upload/session-store";
import { tokenStore } from "@/lib/upload/token-store";
import type { OutputData } from "@editorjs/editorjs";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

const Editor = dynamic(
  () =>
    import("@/components/editor/editor").then((mod) => ({
      default: mod.Editor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20 text-gray-300">
        <span className="animate-pulse text-sm tracking-widest uppercase font-mono">
          Loading editor…
        </span>
      </div>
    ),
  },
);

type SaveStatus = "idle" | "saving" | "saved" | "error";

const saveLabel: Record<SaveStatus, string> = {
  idle: "Save",
  saving: "Saving…",
  saved: "Saved ✓",
  error: "Retry",
};

const saveClass: Record<SaveStatus, string> = {
  idle: "bg-black text-white hover:bg-gray-800",
  saving: "bg-gray-200 text-gray-400 cursor-not-allowed",
  saved: "bg-gray-900 text-gray-300",
  error: "bg-red-600 text-white hover:bg-red-700",
};

export default function EditorPage() {
  const router = useRouter();
  const [editorData, setEditorData] = useState<OutputData>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [wordCount, setWordCount] = useState(0);
  const [blockCount, setBlockCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSessionVerified(sessionStore.isVerified());

    const onVerified = () => {
      setSessionVerified(true);
      setShowExpiredBanner(false);
    };

    const onExpired = () => {
      setSessionVerified(false);
      setShowExpiredBanner(false);
    };

    const onSessionExpired = () => {
      setSessionVerified(false);
      setShowExpiredBanner(true);
      setIsDirty(false);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(
        () => setShowExpiredBanner(false),
        8000,
      );
    };

    window.addEventListener("auth:verified", onVerified);
    window.addEventListener("auth:required", onExpired);
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("auth:verified", onVerified);
      window.removeEventListener("auth:required", onExpired);
      window.removeEventListener("auth:session-expired", onSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (sessionVerified) return;
    const interval = setInterval(() => {
      if (sessionStore.isVerified()) {
        setSessionVerified(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [sessionVerified]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleChange = useCallback((data: OutputData) => {
    setEditorData(data);
    setIsDirty(true);
    setSaveStatus("idle");

    const words = data.blocks
      .map((b) => {
        const raw: string =
          b.data?.text ?? b.data?.caption ?? b.data?.content ?? "";
        return raw.replace(/<[^>]*>/g, "").trim();
      })
      .filter(Boolean)
      .join(" ");

    setWordCount(words ? words.split(/\s+/).length : 0);
    setBlockCount(data.blocks.length);
  }, []);

  const handleSave = async () => {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      await fetch("/api/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editorData),
      });
      setSaveStatus("saved");
      setIsDirty(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      tokenStore.clear();
      sessionStore.clear();
      setIsDirty(false);
      setEditorData(undefined);
      setWordCount(0);
      setBlockCount(0);
      setSaveStatus("idle");
      setShowExpiredBanner(false);
      window.dispatchEvent(new Event("auth:required"));
      setLoggingOut(false);
    }
  };

  const saveBtnClass = `px-4 py-1.5 rounded-full text-xs font-medium font-mono tracking-wide transition-all duration-200 ${saveClass[saveStatus]}`;

  return (
    <div className="min-h-screen px-6 py-6 md:px-12 md:py-12 bg-gray-50 font-serif">
      {showExpiredBanner && (
        <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 font-mono">
              Your session has expired. Paste a new token and verify 2FA to
              resume uploading.
            </p>
          </div>
          <button
            onClick={() => setShowExpiredBanner(false)}
            className="text-amber-400 hover:text-amber-600 font-mono text-xs transition-colors shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all text-sm"
          >
            ←
          </button>
          <span className="text-xs tracking-widest uppercase text-gray-400 font-mono">
            Editor
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(wordCount > 0 || blockCount > 0) && (
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 font-mono">
              <span>{wordCount} words</span>
              <span className="text-gray-200">·</span>
              <span>{blockCount} blocks</span>
            </div>
          )}

          {isDirty && saveStatus === "idle" && (
            <span className="text-xs text-gray-400 italic font-mono">
              Unsaved
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !sessionVerified}
            className={saveBtnClass}
          >
            {saveLabel[saveStatus]}
          </button>

          <div className="w-px h-4 bg-gray-200" />

          <TokenAuth />

          <div className="w-px h-4 bg-gray-200" />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-1.5 rounded-full text-xs font-medium font-mono tracking-wide border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200 shadow-sm">
        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-normal text-gray-900 tracking-tight font-serif">
            New Document
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-mono">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="px-4 py-6 min-h-120">
          {sessionVerified ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20 text-gray-300">
                  <span className="animate-pulse text-sm tracking-widest uppercase font-mono">
                    Loading…
                  </span>
                </div>
              }
            >
              <Editor data={editorData} onChange={handleChange} />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-lg">
                🔒
              </div>
              <p className="text-sm text-gray-400 font-mono text-center">
                Paste your token and verify 2FA
                <br />
                <span className="text-xs text-gray-300">to start editing</span>
              </p>
            </div>
          )}
        </div>

        <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-300 font-mono">
            Files uploaded to R2 · Auth required
          </span>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !sessionVerified}
            className={saveBtnClass}
          >
            {saveLabel[saveStatus]}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-4 text-center">
        <span className="text-xs text-gray-300 font-mono">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-gray-400 text-xs font-mono">
            Tab
          </kbd>{" "}
          to add a new block
        </span>
      </div>
    </div>
  );
}
