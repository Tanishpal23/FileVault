"use client";

import React, { useState, useEffect, use } from "react";
import {
  Download,
  Lock,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  Archive,
  File,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Folder,
  ShieldCheck,
} from "lucide-react";
import { shareApi, PublicSharedDetails } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="h-10 w-10 text-emerald-500" />;
  }
  if (mimeType.startsWith("video/")) {
    return <Film className="h-10 w-10 text-purple-500" />;
  }
  if (mimeType.startsWith("audio/")) {
    return <Music className="h-10 w-10 text-pink-500" />;
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="h-10 w-10 text-rose-500" />;
  }
  if (mimeType.includes("zip") || mimeType.includes("compressed") || mimeType.includes("tar")) {
    return <Archive className="h-10 w-10 text-amber-500" />;
  }
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json")) {
    return <Code className="h-10 w-10 text-indigo-500" />;
  }
  return <File className="h-10 w-10 text-blue-500" />;
}

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr) || 0;
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [details, setDetails] = useState<PublicSharedDetails | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [token]);

  const loadDetails = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await shareApi.getPublicDetails(token);
      setDetails(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load shared file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      if (details?.requiresPassword && !passwordUnlocked) {
        await shareApi.verifyPublicPassword(token, password);
        setPasswordUnlocked(true);
      }

      const res = await shareApi.downloadPublicFile(token, password || undefined);
      const link = document.createElement("a");
      link.href = res.downloadUrl;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMsg(err.message || "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#070a11] dark:to-[#090d16] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Bar */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto py-2">
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Folder className="h-5 w-5 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            FileVault
          </span>
        </a>
        <ThemeToggle />
      </header>

      {/* Center Card */}
      <main className="flex-1 flex items-center justify-center max-w-md w-full mx-auto my-8">
        <div className="w-full rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-8 shadow-2xl dark:border-slate-800/80 dark:bg-slate-900/95 transition-all text-center">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs text-slate-400">Loading shared file...</p>
            </div>
          ) : errorMsg && !details ? (
            <div className="py-8 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Link Unavailable
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {errorMsg}
                </p>
              </div>
              <a
                href="/"
                className="inline-block rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Back to Home
              </a>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* File Icon & Name */}
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 mb-4 shadow-xs">
                  {getFileIcon(details.mimeType)}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white max-w-xs truncate">
                  {details.fileName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {formatBytes(details.fileSize)} • Shared by {details.ownerName}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {details.requiresPassword && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    <Lock className="h-3 w-3" /> Password Protected
                  </span>
                )}
                {details.expiresAt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Expires {new Date(details.expiresAt).toLocaleDateString()}
                  </span>
                )}
                {details.downloadLimit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {details.downloadCount}/{details.downloadLimit} downloads used
                  </span>
                )}
              </div>

              {/* Password Challenge */}
              {details.requiresPassword && !passwordUnlocked && (
                <form onSubmit={handleDownload} className="space-y-3 pt-2 text-left">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter password to download
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                    required
                  />
                  {errorMsg && (
                    <p className="text-[11px] text-rose-500 font-medium">{errorMsg}</p>
                  )}
                </form>
              )}

              {/* Download CTA */}
              <button
                type="button"
                onClick={() => handleDownload()}
                disabled={isDownloading || (details.requiresPassword && !passwordUnlocked && !password.trim())}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing secure download...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download File ({formatBytes(details.fileSize)})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Encrypted direct-to-cloud link</span>
              </div>
            </div>
          ) : null}
        </div>
      </main>

    </div>
  );
}
