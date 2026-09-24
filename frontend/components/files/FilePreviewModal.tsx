"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Star,
  FileText,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Music,
  Maximize2,
} from "lucide-react";
import { FileItem, fileApi, downloadFile } from "@/lib/api";
import { CommentThread } from "@/components/comments/CommentThread";
import { isTextOrCodeFile } from "@/lib/fileUtils";

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStar?: (fileId: string) => void;
  currentUserId?: string;
}

export default function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onToggleStar,
  currentUserId,
}: FilePreviewModalProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  // Image controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Code controls
  const [copied, setCopied] = useState(false);

  // Comments drawer toggle
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) {
      setDownloadUrl(null);
      setTextContent(null);
      setError(null);
      setZoom(1);
      setRotation(0);
      setShowComments(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);

    const isTextFile = isTextOrCodeFile(file.name, file.mimeType);

    // 1. Fetch download URL for the Download button and media playback
    const downloadPromise = fileApi
      .getDownloadUrl(file.id, "inline")
      .then((res) => {
        if (!isMounted) return null;
        setDownloadUrl(res.downloadUrl);
        return res.downloadUrl;
      })
      .catch((err: any) => {
        if (isMounted && !isTextFile) {
          setError(err.message || "Failed to load preview URL");
        }
        return null;
      });

    // 2. If it's a text/code file, fetch its raw content directly via backend API
    const contentPromise = isTextFile
      ? fileApi
          .getContent(file.id)
          .then((res: any) => {
            const text = res?.content ?? res?.data?.content ?? (typeof res === "string" ? res : null);
            if (isMounted && text !== null && text !== undefined) {
              setTextContent(String(text));
            }
          })
          .catch(async (contentErr: any) => {
            // Fallback: try direct fetch from downloadUrl if available
            try {
              const directUrl = await downloadPromise;
              if (directUrl) {
                const textRes = await fetch(directUrl);
                if (textRes.ok) {
                  const text = await textRes.text();
                  if (isMounted) setTextContent(text);
                  return;
                }
              }
            } catch {
              // Fallback fetch failed
            }
            if (isMounted) {
              setError(contentErr.message || "Failed to load file preview");
            }
          })
      : Promise.resolve();

    Promise.all([downloadPromise, contentPromise]).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const isImage = file.mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|ico)$/i.test(file.name);
  const isVideo = file.mimeType.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
  const isAudio = file.mimeType.startsWith("audio/") || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(file.name);
  const isPdf = file.mimeType === "application/pdf" || file.mimeType.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
  const isText = Boolean(textContent !== null);

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr) || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetImage = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-6xl h-[88vh] rounded-2xl border border-slate-200/20 bg-slate-900 text-white shadow-2xl overflow-hidden">
        {/* Top Header Toolbar */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-semibold text-slate-100 truncate max-w-xs sm:max-w-md">
              {file.name}
            </h2>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full shrink-0 font-mono">
              {formatBytes(file.size)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Image zoom/rotate controls */}
            {isImage && downloadUrl && (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 mr-1 text-slate-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:text-white rounded transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[11px] px-1 font-mono">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:text-white rounded transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 hover:text-white rounded transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetImage}
                  className="p-1.5 hover:text-white rounded transition-colors"
                  title="Reset view"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Code Copy button */}
            {isText && textContent && (
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}

            {/* Toggle Comments Drawer */}
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                showComments
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title="Collaborate & Comments"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Comments</span>
            </button>

            {onToggleStar && (
              <button
                type="button"
                onClick={() => onToggleStar(file.id)}
                className={`rounded-lg p-2 transition-colors ${
                  file.isStarred
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={file.isStarred ? "Unstar" : "Star"}
              >
                <Star
                  className={`h-4 w-4 ${file.isStarred ? "fill-amber-400" : ""}`}
                />
              </button>
            )}

            {downloadUrl && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadFile(file);
                  } catch {
                    window.open(downloadUrl, "_blank");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body + Optional Comments Drawer */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Main Media / Content View Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#070a11] relative">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-xs">Generating secure preview stream...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-center text-rose-400 max-w-sm">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p className="text-sm font-semibold">Preview Unavailable</p>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
            ) : downloadUrl ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                {/* Image Preview with Interactive Zoom & Rotation */}
                {isImage && (
                  <div className="flex items-center justify-center w-full h-full overflow-auto">
                    <img
                      src={downloadUrl}
                      alt={file.name}
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: "transform 0.15s ease-out",
                      }}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-2xl origin-center"
                    />
                  </div>
                )}

                {/* Video Preview */}
                {isVideo && (
                  <video
                    src={downloadUrl}
                    controls
                    autoPlay
                    className="max-h-full max-w-full rounded-lg shadow-2xl"
                  />
                )}

                {/* Audio Preview */}
                {isAudio && (
                  <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-md w-full text-center backdrop-blur-md">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                      <Music className="h-10 w-10" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100 truncate mb-1">
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-mono">
                      {formatBytes(file.size)}
                    </p>
                    <audio src={downloadUrl} controls autoPlay className="w-full" />
                  </div>
                )}

                {/* PDF Preview */}
                {isPdf && (
                  <iframe
                    src={`${downloadUrl}#toolbar=1`}
                    title={file.name}
                    className="w-full h-full rounded-xl border border-slate-800 bg-white"
                  />
                )}

                {/* Text / Code Preview with Synchronized Line Numbers */}
                {isText && (
                  <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-800 overflow-auto font-mono text-xs text-slate-200">
                    <table className="w-full border-collapse">
                      <tbody>
                        {textContent?.split("\n").map((line, i) => (
                          <tr key={i} className="hover:bg-slate-900/60 transition-colors group">
                            <td className="select-none py-1 px-3 bg-slate-900/40 border-r border-slate-800/80 text-slate-500 text-right font-mono align-top w-12 min-w-[3.5rem] text-[11px] leading-5 group-hover:text-slate-400">
                              {i + 1}
                            </td>
                            <td className="py-1 px-4 whitespace-pre font-mono text-slate-200 align-top leading-5 text-xs">
                              {line || "\u00A0"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Fallback Card */}
                {!isImage && !isVideo && !isAudio && !isPdf && !isText && (
                  <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center max-w-md shadow-xl backdrop-blur-md">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-mono">
                      {file.mimeType} • {formatBytes(file.size)}
                    </p>
                    <a
                      href={downloadUrl}
                      download={file.name}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </a>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Integrated Real-Time Comments Drawer */}
          {showComments && (
            <div className="w-80 sm:w-96 h-full shrink-0 border-l border-slate-800 flex flex-col bg-slate-900">
              <CommentThread
                fileId={file.id}
                fileName={file.name}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
