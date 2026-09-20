"use client";

import React from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  Archive,
  File,
} from "lucide-react";
import { useUpload, UploadItem } from "@/context/UploadContext";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <ImageIcon className="h-4 w-4 text-emerald-500" />;
  }
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) {
    return <Film className="h-4 w-4 text-purple-500" />;
  }
  if (["mp3", "wav", "flac", "aac"].includes(ext)) {
    return <Music className="h-4 w-4 text-pink-500" />;
  }
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) {
    return <Archive className="h-4 w-4 text-amber-500" />;
  }
  if (["ts", "tsx", "js", "jsx", "json", "html", "css", "py"].includes(ext)) {
    return <Code className="h-4 w-4 text-indigo-500" />;
  }
  return <File className="h-4 w-4 text-slate-400" />;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "";
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatEta(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return "";
  if (seconds < 60) return `${seconds}s left`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s left`;
}

export default function UploadProgressDrawer() {
  const {
    uploads,
    isDrawerOpen,
    isMinimized,
    setIsDrawerOpen,
    setIsMinimized,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    activeCount,
  } = useUpload();

  if (!isDrawerOpen || uploads.length === 0) {
    return null;
  }

  const completedCount = uploads.filter((u) => u.state === "completed").length;
  const totalCount = uploads.length;
  const overallPercentage =
    totalCount > 0
      ? Math.round(
          uploads.reduce((acc, u) => acc + (u.progress.percentage || 0), 0) /
            totalCount
        )
      : 0;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl dark:border-slate-800/80 dark:bg-slate-900/95 transition-all overflow-hidden">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {activeCount > 0 ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UploadCloud className="h-4 w-4 animate-bounce" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {activeCount > 0
                ? `Uploading ${activeCount} ${activeCount === 1 ? "file" : "files"}...`
                : `${completedCount} ${completedCount === 1 ? "file" : "files"} uploaded`}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {completedCount} of {totalCount} completed ({overallPercentage}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {completedCount > 0 && (
            <button
              type="button"
              onClick={clearCompleted}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 px-1.5 py-1 rounded cursor-pointer"
              title="Clear finished"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Progress Bar on Header */}
      {activeCount > 0 && (
        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      )}

      {/* Upload Items List (Collapsible) */}
      {!isMinimized && (
        <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60 p-2 space-y-1">
          {uploads.map((item) => (
            <UploadItemRow
              key={item.id}
              item={item}
              onPause={() => pauseUpload(item.id)}
              onResume={() => resumeUpload(item.id)}
              onCancel={() => cancelUpload(item.id)}
              onRetry={() => retryUpload(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadItemRow({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: {
  item: UploadItem;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const percent = item.progress.percentage || 0;
  const speed = formatSpeed(item.progress.speedBytesPerSec || 0);
  const eta = formatEta(item.progress.etaSeconds || 0);

  return (
    <div className="group rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-800">
            {getFileIcon(item.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
              {item.name}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              <span>{formatBytes(item.size)}</span>
              {item.state === "uploading" && (
                <>
                  <span>•</span>
                  <span>{percent}%</span>
                  {speed && (
                    <>
                      <span>•</span>
                      <span>{speed}</span>
                    </>
                  )}
                  {eta && (
                    <>
                      <span>•</span>
                      <span>{eta}</span>
                    </>
                  )}
                </>
              )}
              {item.state === "paused" && (
                <>
                  <span>•</span>
                  <span className="text-amber-500 font-medium">Paused</span>
                </>
              )}
              {item.state === "completed" && (
                <>
                  <span>•</span>
                  <span className="text-emerald-500 font-medium">Completed</span>
                </>
              )}
              {item.state === "error" && (
                <>
                  <span>•</span>
                  <span className="text-rose-500 font-medium truncate">
                    {item.error || "Upload failed"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          {item.state === "uploading" && (
            <button
              type="button"
              onClick={onPause}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200 cursor-pointer"
              title="Pause"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          )}

          {item.state === "paused" && (
            <button
              type="button"
              onClick={onResume}
              className="rounded-lg p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 cursor-pointer"
              title="Resume"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </button>
          )}

          {item.state === "error" && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 cursor-pointer"
              title="Retry"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}

          {item.state === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-rose-500 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-rose-400 cursor-pointer"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Item Progress Bar */}
      {(item.state === "uploading" || item.state === "paused") && (
        <div className="mt-2 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              item.state === "paused" ? "bg-amber-400" : "bg-indigo-600"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
