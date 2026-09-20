"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Code,
  Archive,
  File,
  Download,
  Eye,
  Loader2,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { shareApi, fileApi, FileItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import FilePreviewModal from "@/components/files/FilePreviewModal";
import ShareModal from "@/components/sharing/ShareModal";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="h-5 w-5 text-emerald-500" />;
  }
  if (mimeType.startsWith("video/")) {
    return <Film className="h-5 w-5 text-purple-500" />;
  }
  if (mimeType.startsWith("audio/")) {
    return <Music className="h-5 w-5 text-pink-500" />;
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="h-5 w-5 text-rose-500" />;
  }
  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return <Archive className="h-5 w-5 text-amber-500" />;
  }
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json")) {
    return <Code className="h-5 w-5 text-indigo-500" />;
  }
  return <File className="h-5 w-5 text-blue-500" />;
}

function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr) || 0;
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function SharedByMePage() {
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareTargetFile, setShareTargetFile] = useState<FileItem | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadSharedFiles();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user]);

  const loadSharedFiles = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await shareApi.getSharedByMe();
      setFiles(data || []);
    } catch {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const res = await fileApi.getDownloadUrl(file.id);
      const link = document.createElement("a");
      link.href = res.downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to download file");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Shared by me
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Files you have shared with teammates or through public links
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs text-slate-400">Loading shared files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-4">
            <Share2 className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            You haven't shared any files yet
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Share files with colleagues or generate public links from your file list.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900/90">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-medium dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="py-3 pl-4 pr-3">Name</th>
                  <th className="py-3 px-3">Collaborators</th>
                  <th className="py-3 px-3">Public Links</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Last Modified</th>
                  <th className="py-3 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{file.collaboratorCount || 0} people</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <LinkIcon className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{file.activeLinkCount || 0} active</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setShareTargetFile(file)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/60 cursor-pointer"
                          title="Manage Sharing"
                        >
                          <Share2 className="h-3 w-3" />
                          <span>Manage</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {shareTargetFile && (
        <ShareModal
          file={shareTargetFile}
          isOpen={Boolean(shareTargetFile)}
          onClose={() => {
            setShareTargetFile(null);
            loadSharedFiles();
          }}
        />
      )}
    </div>
  );
}
