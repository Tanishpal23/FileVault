"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { useUpload } from "@/context/UploadContext";

export default function UploadDropzoneOverlay({ targetFolderId }: { targetFolderId?: string | null }) {
  const { addFiles } = useUpload();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = React.useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsDragging(false);
        dragCounter.current = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files, targetFolderId);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [addFiles, targetFolderId]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-500 bg-white/95 dark:bg-slate-900/95 p-12 shadow-2xl text-center max-w-lg mx-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mb-5 animate-bounce">
          <UploadCloud className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Drop your files here
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Release to immediately upload with chunked resumable multipart engine
        </p>
      </div>
    </div>
  );
}
