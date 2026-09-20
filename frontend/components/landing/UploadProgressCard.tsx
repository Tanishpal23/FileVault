"use client";

import React, { useState } from "react";
import { FileArchive, FileText, CheckCircle2, X } from "lucide-react";

export default function UploadProgressCard() {
  const [closed, setClosed] = useState(false);

  if (closed) {
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setClosed(false)}
          className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 cursor-pointer"
        >
          View live upload preview
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Uploading 3 files...
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setClosed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Close preview"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Files List */}
      <div className="mt-4 space-y-4">
        {/* Item 1: project.zip */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <FileArchive className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">project.zip</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              <span className="text-slate-700 dark:text-slate-200 font-semibold">82%</span>
              <span>1.2 GB / 1.5 GB</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
              style={{ width: "82%" }}
            />
          </div>
        </div>

        {/* Item 2: images.zip */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <FileArchive className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">images.zip</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              <span className="text-slate-700 dark:text-slate-200 font-semibold">54%</span>
              <span>640 MB / 1.2 GB</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
              style={{ width: "54%" }}
            />
          </div>
        </div>

        {/* Item 3: report.pdf (Completed) */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">report.pdf</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400">12 MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
