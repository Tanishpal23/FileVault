"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  FileText,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  History,
  Eye,
  Loader2,
  LayoutGrid,
  List,
  Clock,
  HardDrive,
} from "lucide-react";
import { searchApi, fileApi, downloadFile } from "@/lib/api";
import { ShareModal } from "@/components/sharing/ShareModal";
import { VersionHistoryModal } from "@/components/files/VersionHistoryModal";
import FilePreviewModal from "@/components/files/FilePreviewModal";
import { useAuth } from "@/context/AuthContext";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

export default function StarredPage() {
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [shareModalFile, setShareModalFile] = useState<{ id: string; name: string } | null>(null);
  const [versionModalFile, setVersionModalFile] = useState<{ id: string; name: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: ConfirmVariant;
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const fetchStarred = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await searchApi.getStarred();
      setFiles(res.files || []);
    } catch (err: any) {
      if (err?.status !== 401 && err?.code !== "NO_TOKEN") {
        console.warn("Failed to load starred files", err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchStarred();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr) || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleToggleStar = async (fileId: string) => {
    // Optimistically remove from list
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    try {
      await fileApi.toggleStar(fileId);
    } catch (err) {
      // Revert if error
      fetchStarred();
    }
  };

  const handleDownload = async (file: any) => {
    try {
      await downloadFile(file);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to download file");
    }
  };

  const handleDelete = (file: any) => {
    setConfirmConfig({
      isOpen: true,
      title: "Move to Trash?",
      description: `Are you sure you want to move "${file.name}" to trash? You can restore it later from Trash.`,
      confirmText: "Move to Trash",
      variant: "danger",
      action: async () => {
        try {
          await fileApi.delete(file.id);
          setFiles((prev) => prev.filter((f) => f.id !== file.id));
        } catch (err: any) {
          alert(err.response?.data?.error?.message || "Failed to delete file");
        }
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400">
              <Star className="h-4 w-4 fill-current" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Starred
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Fast access to your most important documents and files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200/80 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1 text-slate-600 dark:text-slate-400 ${
                viewMode === "list"
                  ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1 text-slate-600 dark:text-slate-400 ${
                viewMode === "grid"
                  ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs">Loading starred files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-400 mb-3">
            <Star className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No starred files
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Add stars to files that you want to easily find again. Starred items will appear here.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Name</th>
                <th className="hidden sm:table-cell px-4 py-3">Folder</th>
                <th className="px-4 py-3">Size</th>
                <th className="hidden md:table-cell px-4 py-3">Last Modified</th>
                <th className="px-4 py-3 text-center">Preview</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStar(file.id)}
                      className="text-amber-500 hover:text-amber-600 cursor-pointer"
                      title="Remove star"
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-500 dark:text-slate-400">
                    {file.folder?.name || "Root"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatDate(file.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                      title="Preview file"
                      aria-label={`Preview ${file.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareModalFile({ id: file.id, name: file.name })}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVersionModalFile({ id: file.id, name: file.name })}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                        title="Version history"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        title="Move to trash"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStar(file.id)}
                    className="text-amber-500 hover:text-amber-600 cursor-pointer"
                    title="Remove star"
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                </div>

                <h3 className="mt-3 truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {file.name}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>{file.folder?.name || "Root"}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">
                  {formatDate(file.updatedAt)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareModalFile({ id: file.id, name: file.name })}
                    className="rounded-md p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVersionModalFile({ id: file.id, name: file.name })}
                    className="rounded-md p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Version history"
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {shareModalFile && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareModalFile(null)}
          fileId={shareModalFile.id}
          fileName={shareModalFile.name}
        />
      )}

      {versionModalFile && (
        <VersionHistoryModal
          isOpen={true}
          onClose={() => setVersionModalFile(null)}
          fileId={versionModalFile.id}
          fileName={versionModalFile.name}
          onVersionRestored={() => fetchStarred()}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (confirmConfig.action) {
            await confirmConfig.action();
          }
        }}
      />
    </div>
  );
}
