"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Folder,
  Download,
  Share2,
  Trash2,
  Star,
  History,
  Loader2,
  Filter,
  X,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import { searchApi, fileApi, downloadFile } from "@/lib/api";
import { ShareModal } from "@/components/sharing/ShareModal";
import { VersionHistoryModal } from "@/components/files/VersionHistoryModal";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("any");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [loading, setLoading] = useState(false);

  const [shareModalFile, setShareModalFile] = useState<{ id: string; name: string } | null>(null);
  const [versionModalFile, setVersionModalFile] = useState<{ id: string; name: string } | null>(null);
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

  const fileTypes = [
    { id: "all", label: "All Types" },
    { id: "document", label: "Documents" },
    { id: "image", label: "Images" },
    { id: "video", label: "Videos" },
    { id: "audio", label: "Audio" },
    { id: "spreadsheet", label: "Spreadsheets" },
    { id: "archive", label: "Archives" },
  ];

  const executeSearch = async () => {
    if (!query && selectedType === "all" && !starredOnly && dateFilter === "any") {
      setFiles([]);
      setFolders([]);
      setTotalFiles(0);
      setTotalFolders(0);
      return;
    }

    setLoading(true);
    try {
      let startDate: string | undefined = undefined;
      const now = new Date();

      if (dateFilter === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (dateFilter === "week" || dateFilter === "last7") {
        startDate = new Date(now.getTime() - 7 * 86400000).toISOString();
      } else if (dateFilter === "month" || dateFilter === "last30") {
        startDate = new Date(now.getTime() - 30 * 86400000).toISOString();
      }

      const res = await searchApi.search({
        q: query.trim() || undefined,
        type: selectedType !== "all" ? selectedType : undefined,
        isStarred: starredOnly ? true : undefined,
        startDate,
        limit: 50,
      });

      setFiles(res.files || []);
      setFolders(res.folders || []);
      setTotalFiles(res.totalFiles || 0);
      setTotalFolders(res.totalFolders || 0);
    } catch (err: any) {
      if (err?.status !== 401 && err?.code !== "NO_TOKEN") {
        console.warn("Search failed", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [query, selectedType, starredOnly, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    executeSearch();
  };

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
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isStarred: !f.isStarred } : f))
    );
    try {
      await fileApi.toggleStar(fileId);
    } catch (err) {
      executeSearch();
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
      {/* Search Bar & Header */}
      <div className="border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file or folder name..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                router.push("/dashboard/search");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Filter Pills Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {fileTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                  selectedType === t.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setStarredOnly(!starredOnly)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                starredOnly
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <Star className={`h-3 w-3 ${starredOnly ? "fill-current" : ""}`} />
              <span>Starred only</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:outline-none"
            >
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 days</option>
              <option value="month">Past 30 days</option>
            </select>

            {/* View Mode Toggle */}
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

        {/* Results summary */}
        {!loading && (
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Found {totalFiles} {totalFiles === 1 ? "file" : "files"}
            {totalFolders > 0 && ` and ${totalFolders} ${totalFolders === 1 ? "folder" : "folders"}`}
            {query && ` for "${query}"`}
          </div>
        )}
      </div>

      {/* Main Results */}
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs">Searching files and folders...</p>
        </div>
      ) : totalFiles === 0 && totalFolders === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No matching results
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Try searching for a different keyword or resetting your filters.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Matching Folders */}
          {folders.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Matching Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folders.map((folder) => (
                  <a
                    key={folder.id}
                    href={`/dashboard?folderId=${folder.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <Folder className="h-5 w-5 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                        {folder.name}
                      </p>
                      {folder.breadcrumbs && folder.breadcrumbs.length > 0 && (
                        <p className="truncate text-[10px] text-slate-400">
                          {folder.breadcrumbs.map((b: any) => b.name).join(" / ")}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Matching Files */}
          {files.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Matching Files ({files.length})
              </h2>

              {viewMode === "list" ? (
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200/80 bg-slate-50/70 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                      <tr>
                        <th className="px-4 py-3 w-10"></th>
                        <th className="px-4 py-3">File Name</th>
                        <th className="hidden sm:table-cell px-4 py-3">Location</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="hidden md:table-cell px-4 py-3">Last Modified</th>
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
                              className={`cursor-pointer ${
                                file.isStarred
                                  ? "text-amber-500 hover:text-amber-600"
                                  : "text-slate-300 hover:text-amber-400 dark:text-slate-600"
                              }`}
                            >
                              <Star
                                className={`h-4 w-4 ${file.isStarred ? "fill-current" : ""}`}
                              />
                            </button>
                          </td>
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
                            {formatDate(file.updatedAt)}
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
                                onClick={() =>
                                  setShareModalFile({ id: file.id, name: file.name })
                                }
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setVersionModalFile({ id: file.id, name: file.name })
                                }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                            className={`cursor-pointer ${
                              file.isStarred
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-slate-300 hover:text-amber-400 dark:text-slate-600"
                            }`}
                          >
                            <Star
                              className={`h-4 w-4 ${file.isStarred ? "fill-current" : ""}`}
                            />
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
                            onClick={() =>
                              setShareModalFile({ id: file.id, name: file.name })
                            }
                            className="rounded-md p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setVersionModalFile({ id: file.id, name: file.name })
                            }
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
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
          onVersionRestored={() => executeSearch()}
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
