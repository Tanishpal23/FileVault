"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  History,
  Download,
  RotateCcw,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  HardDrive,
  User as UserIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { versionApi, FileVersionItem } from "@/lib/api";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  onVersionRestored?: () => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  onVersionRestored,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<FileVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await versionApi.list(fileId);
      setVersions(res.versions || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load versions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fileId]);

  if (!isOpen) return null;

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

  const handleDownload = async (version: FileVersionItem) => {
    setActionLoadingId(`download-${version.id}`);
    try {
      const res = await versionApi.getDownloadUrl(fileId, version.id);
      window.open(res.downloadUrl, "_blank");
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to get download URL");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = (version: FileVersionItem) => {
    setConfirmConfig({
      isOpen: true,
      title: "Restore Version?",
      description: `Are you sure you want to restore version ${version.versionNumber}? This will create a new current version pointing to this snapshot.`,
      confirmText: "Restore Version",
      variant: "primary",
      action: async () => {
        setActionLoadingId(`restore-${version.id}`);
        try {
          await versionApi.restore(fileId, version.id);
          await fetchVersions();
          if (onVersionRestored) onVersionRestored();
        } catch (err: any) {
          alert(err.response?.data?.error?.message || "Failed to restore version");
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleDelete = (version: FileVersionItem) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Version?",
      description: `Are you sure you want to delete version ${version.versionNumber}? This action cannot be undone.`,
      confirmText: "Delete Permanently",
      variant: "danger",
      action: async () => {
        setActionLoadingId(`delete-${version.id}`);
        try {
          await versionApi.delete(fileId, version.id);
          await fetchVersions();
        } catch (err: any) {
          alert(err.response?.data?.error?.message || "Failed to delete version");
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await versionApi.uploadNewVersion(fileId, file);
      await fetchVersions();
      if (onVersionRestored) onVersionRestored();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to upload new version");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Version History
              </h2>
              <p className="max-w-md truncate text-xs text-slate-500 dark:text-slate-400">
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>Upload New Version</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs">Loading version history...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : versions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No version history available.
            </p>
          ) : (
            <div className="space-y-3">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className={`group relative flex items-center justify-between rounded-xl border p-4 transition-all ${
                    ver.isCurrent
                      ? "border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                      : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        ver.isCurrent
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      v{ver.versionNumber}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          Version {ver.versionNumber}
                        </span>
                        {ver.isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Current Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(ver.size)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(ver.createdAt)}
                        </span>
                        {ver.createdBy?.name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {ver.createdBy.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(ver)}
                      disabled={actionLoadingId === `download-${ver.id}`}
                      title="Download this version"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {actionLoadingId === `download-${ver.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>

                    {!ver.isCurrent && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRestore(ver)}
                          disabled={actionLoadingId === `restore-${ver.id}`}
                          title="Restore this version as current"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          {actionLoadingId === `restore-${ver.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(ver)}
                          disabled={actionLoadingId === `delete-${ver.id}`}
                          title="Delete this historical version"
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        >
                          {actionLoadingId === `delete-${ver.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200/80 bg-slate-50/50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50 flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Restoring an older version preserves all historical snapshots without data loss.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

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
