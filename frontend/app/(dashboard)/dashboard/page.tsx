"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FolderPlus,
  FileText,
  Video,
  FileSpreadsheet,
  Presentation,
  Folder as FolderIcon,
  MoreVertical,
  Star,
  Download,
  Trash2,
  Clock,
  HardDrive,
  Users,
  CheckCircle2,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Loader2,
  FolderOpen,
  Share2,
  History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpload } from "@/context/UploadContext";
import {
  folderApi,
  fileApi,
  downloadFile,
  FolderItem,
  FileItem,
  FolderContentsResponse,
} from "@/lib/api";
import Breadcrumbs, { BreadcrumbItem } from "@/components/files/Breadcrumbs";
import NewFolderModal from "@/components/files/NewFolderModal";
import RenameModal from "@/components/files/RenameModal";
import FilePreviewModal from "@/components/files/FilePreviewModal";
import ShareModal from "@/components/sharing/ShareModal";
import { VersionHistoryModal } from "@/components/files/VersionHistoryModal";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: "root", name: "My Files" },
  ]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Modals & Menu States
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
    type: "folder" | "file";
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [versionFile, setVersionFile] = useState<FileItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [alertToast, setAlertToast] = useState<string | null>(null);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles, registerUploadListener } = useUpload();

  const showToast = (message: string) => {
    setAlertToast(message);
    setTimeout(() => setAlertToast(null), 3500);
  };

  const loadContents = useCallback(async (folderId: string) => {
    setIsLoading(true);
    try {
      const data = await folderApi.getContents(folderId);
      setFolders(data.folders || []);
      setFiles(data.files || []);
      if (data.breadcrumbs && data.breadcrumbs.length > 0) {
        setBreadcrumbs(data.breadcrumbs);
      } else {
        setBreadcrumbs([{ id: "root", name: "My Files" }]);
      }
    } catch (err: any) {
      setFolders([]);
      setFiles([]);
      setBreadcrumbs([{ id: "root", name: "My Files" }]);
      if (err?.message && !err.message.includes("401")) {
        showToast("Failed to load contents: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContents(currentFolderId);
  }, [currentFolderId, loadContents]);

  useEffect(() => {
    const unregister = registerUploadListener(() => {
      loadContents(currentFolderId);
    });
    return unregister;
  }, [currentFolderId, loadContents, registerUploadListener]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files, currentFolderId === "root" ? null : currentFolderId);
      e.target.value = "";
    }
  };

  // Folder Actions
  const handleNavigate = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async (name: string, color?: string) => {
    await folderApi.create({
      name,
      parentId: currentFolderId === "root" ? null : currentFolderId,
      color,
    });
    showToast(`Folder "${name}" created successfully`);
    loadContents(currentFolderId);
  };

  const handleRename = async (newName: string) => {
    if (!renameTarget) return;
    if (renameTarget.type === "folder") {
      await folderApi.rename(renameTarget.id, newName);
      showToast(`Folder renamed to "${newName}"`);
    } else {
      await fileApi.rename(renameTarget.id, newName);
      showToast(`File renamed to "${newName}"`);
    }
    loadContents(currentFolderId);
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setActiveMenuId(null);
    setConfirmConfig({
      isOpen: true,
      title: "Delete Folder",
      message: `Are you sure you want to delete folder "${folderName}" and all of its contents? It will be moved to the trash bin.`,
      confirmText: "Move Folder to Trash",
      variant: "danger",
      onConfirm: async () => {
        try {
          await folderApi.delete(folderId);
          showToast(`Folder "${folderName}" moved to trash`);
          loadContents(currentFolderId);
        } catch (err: any) {
          showToast(err.message || "Failed to delete folder");
        }
      },
    });
  };

  // File Actions
  const handleDeleteFile = (fileId: string, fileName: string) => {
    setActiveMenuId(null);
    setConfirmConfig({
      isOpen: true,
      title: "Move to Trash",
      message: `Move "${fileName}" to trash? You can recover it from the trash bin within 30 days.`,
      confirmText: "Move to Trash",
      variant: "danger",
      onConfirm: async () => {
        try {
          await fileApi.delete(fileId);
          showToast(`File "${fileName}" moved to trash`);
          loadContents(currentFolderId);
        } catch (err: any) {
          showToast(err.message || "Failed to delete file");
        }
      },
    });
  };

  const handleToggleStar = async (fileId: string) => {
    try {
      const res = await fileApi.toggleStar(fileId);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isStarred: res.isStarred } : f))
      );
    } catch {
      // Local toggle fallback
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isStarred: !f.isStarred } : f))
      );
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      showToast(`Downloading ${file.name}`);
      await downloadFile(file);
    } catch (err: any) {
      alert(err.message || "Failed to download file");
    }
    setActiveMenuId(null);
  };

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr) || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400 shrink-0">
          <FileText className="h-4 w-4" />
        </div>
      );
    }
    if (mimeType.startsWith("video/")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
          <Video className="h-4 w-4" />
        </div>
      );
    }
    if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("csv")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
      );
    }
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-950/60 dark:text-orange-400 shrink-0">
          <Presentation className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
        <FileText className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header: Breadcrumbs & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleNavigate} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            {breadcrumbs[breadcrumbs.length - 1]?.name || "My Files"}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Grid / List Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewFolderOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            New Folder
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {alertToast && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 text-xs text-indigo-900 animate-in fade-in dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{alertToast}</span>
          </div>
          <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">System Alert</span>
        </div>
      )}

      {/* Folders Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Folders ({folders.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : folders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
            <FolderOpen className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No subfolders in this directory</p>
            <button
              type="button"
              onClick={() => setIsNewFolderOpen(true)}
              className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Create folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group relative flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-500/40 transition-all cursor-pointer"
                onClick={() => handleNavigate(folder.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${folder.color || "#6366f1"}18`,
                      color: folder.color || "#6366f1",
                    }}
                  >
                    <FolderIcon className="h-5 w-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {folder.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {folder._count?.files ?? 0} files
                    </p>
                  </div>
                </div>

                {/* Folder Menu */}
                <div
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMenuId(activeMenuId === folder.id ? null : folder.id)
                    }
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {activeMenuId === folder.id && (
                    <div className="absolute right-0 top-8 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20 text-left dark:border-slate-700 dark:bg-slate-800 animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget({ id: folder.id, name: folder.name, type: "folder" });
                          setActiveMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/70"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                        Rename
                      </button>
                      <hr className="my-1 border-slate-100 dark:border-slate-700" />
                      <button
                        type="button"
                        onClick={() => handleDeleteFolder(folder.id, folder.name)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Files Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Files ({files.length})
          </h2>
        </div>

        {files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No files in this folder
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Upload your files here to start organizing and sharing.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Files
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* Table / List View */
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900/90">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Size</th>
                    <th className="py-3 px-4 hidden md:table-cell">Modified</th>
                    <th className="py-3 px-4 text-center">Preview</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                      onClick={() => setPreviewFile(file)}
                    >
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400 transition-colors truncate max-w-xs sm:max-w-md">
                            {file.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {formatBytes(file.size)}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {new Date(file.updatedAt).toLocaleDateString()}
                      </td>

                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
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

                      <td
                        className="py-3 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStar(file.id)}
                            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                              file.isStarred
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                            }`}
                            title={file.isStarred ? "Unstar" : "Star"}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                file.isStarred ? "fill-amber-400" : ""
                              }`}
                            />
                          </button>

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
                            onClick={() => setShareFile(file)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                            title="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setVersionFile(file)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                            title="Version history"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRenameTarget({ id: file.id, name: file.name, type: "file" })
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                            title="Rename"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id, file.name)}
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
          </div>
        ) : (
          /* Grid Cards View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setPreviewFile(file)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="shrink-0 pt-0.5">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex items-center flex-wrap justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggleStar(file.id)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        file.isStarred
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      }`}
                      title={file.isStarred ? "Unstar" : "Star"}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${file.isStarred ? "fill-amber-400" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareFile(file)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Share file"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVersionFile(file)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Version history"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRenameTarget({ id: file.id, name: file.name, type: "file" })
                      }
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Rename file"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Move to trash"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {file.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      {renameTarget && (
        <RenameModal
          isOpen={Boolean(renameTarget)}
          initialName={renameTarget.name}
          itemType={renameTarget.type}
          onClose={() => setRenameTarget(null)}
          onSubmit={handleRename}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          onToggleStar={handleToggleStar}
          currentUserId={user?.id}
        />
      )}

      {shareFile && (
        <ShareModal
          file={shareFile}
          isOpen={Boolean(shareFile)}
          onClose={() => setShareFile(null)}
        />
      )}

      {versionFile && (
        <VersionHistoryModal
          isOpen={Boolean(versionFile)}
          fileId={versionFile.id}
          fileName={versionFile.name}
          onClose={() => setVersionFile(null)}
          onVersionRestored={() => loadContents(currentFolderId)}
        />
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
