"use client";

import React, { useState } from "react";
import {
  Search,
  RotateCcw,
  Bell,
  Folder,
  Users,
  Share2,
  Star,
  Clock,
  Trash2,
  FileText,
  Video,
  FileSpreadsheet,
  Presentation,
  Upload,
  FolderPlus,
  MoreHorizontal,
  Check,
} from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "pdf" | "video" | "excel" | "presentation";
  modified: string;
  size: string;
  shared: boolean;
}

const initialFiles: FileItem[] = [
  {
    id: "1",
    name: "Design System",
    type: "folder",
    modified: "Today, 10:24 AM",
    size: "—",
    shared: true,
  },
  {
    id: "2",
    name: "Marketing",
    type: "folder",
    modified: "Yesterday, 4:32 PM",
    size: "—",
    shared: true,
  },
  {
    id: "3",
    name: "Brand_Guidelines_2026.pdf",
    type: "pdf",
    modified: "Sep 18, 2025",
    size: "4.8 MB",
    shared: true,
  },
  {
    id: "4",
    name: "product-demo.mp4",
    type: "video",
    modified: "Sep 17, 2025",
    size: "142.6 MB",
    shared: true,
  },
  {
    id: "5",
    name: "quarterly_report.xlsx",
    type: "excel",
    modified: "Sep 16, 2025",
    size: "1.6 MB",
    shared: true,
  },
  {
    id: "6",
    name: "presentation.pptx",
    type: "presentation",
    modified: "Sep 15, 2025",
    size: "3.2 MB",
    shared: true,
  },
];

export default function ProductPreview() {
  const [activeNav, setActiveNav] = useState("My Files");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadToast, setUploadToast] = useState(false);

  const filteredFiles = initialFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadClick = () => {
    setUploadToast(true);
    setTimeout(() => setUploadToast(false), 3000);
  };

  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "folder":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400">
            <Folder className="h-4 w-4 fill-amber-400" />
          </div>
        );
      case "pdf":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "video":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Video className="h-4 w-4" />
          </div>
        );
      case "excel":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
        );
      case "presentation":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-50 text-orange-500 dark:bg-orange-950/50 dark:text-orange-400">
            <Presentation className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <FileText className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] overflow-hidden transition-all dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
      {/* Window Header */}
      <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 dark:border-slate-800/80 dark:bg-slate-950/70">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
        </div>

        {/* Search Bar */}
        <div className="relative mx-4 flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, folders, or people..."
            className="w-full rounded-md border border-slate-200/70 bg-white py-1 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600" />
            </button>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
            T
          </div>
        </div>
      </div>

      {/* Window Body: Sidebar + Main Content */}
      <div className="flex min-h-[380px]">
        {/* Left Sidebar */}
        <div className="hidden sm:flex w-44 flex-col justify-between border-r border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800/80 dark:bg-slate-950/40">
          <div className="space-y-4">
            {/* Mini Brand header in app */}
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white">
                <Folder className="h-3 w-3 fill-current" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                FileVault
              </span>
            </div>

            {/* Nav list */}
            <div className="space-y-0.5">
              {[
                { name: "My Files", icon: Folder },
                { name: "Shared with me", icon: Users },
                { name: "Shared by me", icon: Share2 },
                { name: "Starred", icon: Star },
                { name: "Recent", icon: Clock },
                { name: "Trash", icon: Trash2 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveNav(item.name)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage usage widget */}
          <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
              <span>Storage</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                style={{ width: "72%" }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">720 MB / 1 GB</p>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 p-4 sm:p-5 overflow-hidden flex flex-col justify-between dark:bg-slate-900">
          <div>
            {/* Breadcrumb */}
            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span>My Files</span>
              <span className="mx-1">/</span>
              <span className="text-slate-600 dark:text-slate-300">Projects</span>
            </div>

            {/* Folder Heading + Action Buttons */}
            <div className="mt-1.5 flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Projects
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-indigo-700"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <FolderPlus className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  New Folder
                </button>
              </div>
            </div>

            {/* Files Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium hidden md:table-cell">
                      Modified
                    </th>
                    <th className="pb-2 font-medium hidden sm:table-cell">
                      Size
                    </th>
                    <th className="pb-2 font-medium text-right sm:text-left">
                      Shared
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                    >
                      {/* Name */}
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(file.type)}
                          <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[140px] sm:max-w-none">
                            {file.name}
                          </span>
                        </div>
                      </td>

                      {/* Modified */}
                      <td className="py-2.5 text-slate-500 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">
                        {file.modified}
                      </td>

                      {/* Size */}
                      <td className="py-2.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">
                        {file.size}
                      </td>

                      {/* Shared */}
                      <td className="py-2.5 text-right sm:text-left">
                        <div className="flex items-center justify-end sm:justify-start gap-1.5 text-indigo-600 dark:text-indigo-400">
                          <Users className="h-3.5 w-3.5" />
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Upload Notification Toast */}
          {uploadToast && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-900 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Upload dialog ready. Ready for direct R2 chunking.</span>
              </div>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                Live Demo
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
