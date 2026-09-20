"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Folder,
  FileText,
  Clock,
  HardDrive,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { trashApi, TrashItemFile, TrashItemFolder } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

export default function TrashPage() {
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<TrashItemFile[]>([]);
  const [folders, setFolders] = useState<TrashItemFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [emptyTrashLoading, setEmptyTrashLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchTrash = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await trashApi.list();
      setFiles(res.files);
      setFolders(res.folders);
    } catch (err: any) {
      if (err?.status !== 401 && err?.code !== "NO_TOKEN") {
        setNotification({
          type: "error",
          message: err?.message || "Failed to load trash",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchTrash();
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
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    variant: ConfirmVariant;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "danger",
    onConfirm: async () => {},
  });

  const handleRestoreFile = (file: TrashItemFile) => {
    setConfirmConfig({
      isOpen: true,
      title: "Restore File",
      message: `Restore "${file.name}" back to its original folder?`,
      confirmText: "Restore File",
      variant: "success",
      onConfirm: async () => {
        setActionLoadingId(`restore-file-${file.id}`);
        try {
          const res = await trashApi.restoreFile(file.id);
          setNotification({ type: "success", message: res.message });
          await fetchTrash();
        } catch (err: any) {
          setNotification({
            type: "error",
            message: err?.message || "Failed to restore file",
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleRestoreFolder = (folder: TrashItemFolder) => {
    setConfirmConfig({
      isOpen: true,
      title: "Restore Folder",
      message: `Restore folder "${folder.name}" and all of its contents?`,
      confirmText: "Restore Folder",
      variant: "success",
      onConfirm: async () => {
        setActionLoadingId(`restore-folder-${folder.id}`);
        try {
          const res = await trashApi.restoreFolder(folder.id);
          setNotification({ type: "success", message: res.message });
          await fetchTrash();
        } catch (err: any) {
          setNotification({
            type: "error",
            message: err?.message || "Failed to restore folder",
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handlePermanentDeleteFile = (file: TrashItemFile) => {
    setConfirmConfig({
      isOpen: true,
      title: "Permanently Delete File",
      message: `Are you sure you want to permanently delete "${file.name}"? This action CANNOT be undone and storage will be permanently reclaimed.`,
      confirmText: "Delete Permanently",
      variant: "danger",
      onConfirm: async () => {
        setActionLoadingId(`delete-file-${file.id}`);
        try {
          const res = await trashApi.permanentDeleteFile(file.id);
          setNotification({ type: "success", message: res.message });
          await fetchTrash();
        } catch (err: any) {
          setNotification({
            type: "error",
            message: err?.message || "Failed to delete file permanently",
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handlePermanentDeleteFolder = (folder: TrashItemFolder) => {
    setConfirmConfig({
      isOpen: true,
      title: "Permanently Delete Folder",
      message: `Are you sure you want to permanently delete folder "${folder.name}" and all its contents? This CANNOT be undone.`,
      confirmText: "Delete Permanently",
      variant: "danger",
      onConfirm: async () => {
        setActionLoadingId(`delete-folder-${folder.id}`);
        try {
          const res = await trashApi.permanentDeleteFolder(folder.id);
          setNotification({ type: "success", message: res.message });
          await fetchTrash();
        } catch (err: any) {
          setNotification({
            type: "error",
            message: err?.message || "Failed to delete folder permanently",
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Empty Trash Bin",
      message: "Are you sure you want to empty the trash? All files and folders will be permanently deleted and cannot be recovered.",
      confirmText: "Empty Entire Trash",
      variant: "danger",
      onConfirm: async () => {
        setEmptyTrashLoading(true);
        try {
          const res = await trashApi.emptyTrash();
          setNotification({ type: "success", message: res.message });
          await fetchTrash();
        } catch (err: any) {
          setNotification({
            type: "error",
            message: err?.message || "Failed to empty trash",
          });
        } finally {
          setEmptyTrashLoading(false);
        }
      },
    });
  };

  const totalItems = files.length + folders.length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Trash Bin
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Items in the trash will be automatically purged after 30 days.
          </p>
        </div>

        {totalItems > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            disabled={emptyTrashLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {emptyTrashLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Empty Trash ({totalItems})</span>
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`mt-4 flex items-center justify-between rounded-xl p-3.5 text-xs transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-medium underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs">Loading trashed items...</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Trash2 className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Trash is empty
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Deleted files and folders will appear here until they are permanently removed.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Trashed Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                        <Folder className="h-5 w-5 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {folder.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(folder.deletedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleRestoreFolder(folder)}
                        disabled={actionLoadingId === `restore-folder-${folder.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        {actionLoadingId === `restore-folder-${folder.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                        ) : (
                          <RotateCcw className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteFolder(folder)}
                        disabled={actionLoadingId === `delete-folder-${folder.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        title="Delete permanently"
                      >
                        {actionLoadingId === `delete-folder-${folder.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Trashed Files ({files.length})
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200/80 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3">File Name</th>
                      <th className="hidden sm:table-cell px-4 py-3">Original Folder</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="hidden md:table-cell px-4 py-3">Deleted Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate max-w-[200px] sm:max-w-xs">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-slate-500 dark:text-slate-400">
                          {file.folder?.name || "Root"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatBytes(file.size)}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDate(file.deletedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreFile(file)}
                              disabled={actionLoadingId === `restore-file-${file.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                              {actionLoadingId === `restore-file-${file.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                              ) : (
                                <RotateCcw className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                              )}
                              <span>Restore</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePermanentDeleteFile(file)}
                              disabled={actionLoadingId === `delete-file-${file.id}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer transition-colors"
                              title="Delete permanently"
                            >
                              {actionLoadingId === `delete-file-${file.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
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
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
}
