"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  ChunkedUploader,
  UploadProgress,
  UploadState,
} from "@/lib/uploader/ChunkedUploader";

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  folderId?: string | null;
  state: UploadState;
  progress: UploadProgress;
  error?: string;
  completedData?: any;
}

interface UploadContextType {
  uploads: UploadItem[];
  isDrawerOpen: boolean;
  isMinimized: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  setIsMinimized: (min: boolean) => void;
  addFiles: (files: FileList | File[], targetFolderId?: string | null) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
  activeCount: number;
  registerUploadListener: (callback: (fileData: any) => void) => () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Store active ChunkedUploader instances
  const uploadersRef = useRef<Map<string, ChunkedUploader>>(new Map());
  // Store listeners for completed uploads (e.g., to refresh active folder list)
  const listenersRef = useRef<Set<(fileData: any) => void>>(new Set());

  const registerUploadListener = useCallback((callback: (fileData: any) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[], targetFolderId?: string | null) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsDrawerOpen(true);
      setIsMinimized(false);

      const newItems: UploadItem[] = fileArray.map((file) => {
        const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const initialProgress: UploadProgress = {
          bytesUploaded: 0,
          totalBytes: file.size,
          percentage: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
        };

        const uploader = new ChunkedUploader({
          file,
          folderId: targetFolderId,
          onProgress: (progress) => {
            setUploads((prev) =>
              prev.map((item) => (item.id === id ? { ...item, progress } : item))
            );
          },
          onStateChange: (state, error) => {
            setUploads((prev) =>
              prev.map((item) => (item.id === id ? { ...item, state, error } : item))
            );
          },
          onComplete: (fileData) => {
            setUploads((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      state: "completed",
                      completedData: fileData,
                      progress: {
                        ...item.progress,
                        bytesUploaded: item.size,
                        percentage: 100,
                      },
                    }
                  : item
              )
            );
            // Notify all registered components (e.g., file explorer to refresh)
            listenersRef.current.forEach((cb) => cb(fileData));
          },
          onError: (err) => {
            setUploads((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, state: "error", error: err.message } : item
              )
            );
          },
        });

        uploadersRef.current.set(id, uploader);

        // Auto-start upload
        setTimeout(() => uploader.start(), 50);

        return {
          id,
          file,
          name: file.name,
          size: file.size,
          folderId: targetFolderId,
          state: "queued",
          progress: initialProgress,
        };
      });

      setUploads((prev) => [...newItems, ...prev]);
    },
    []
  );

  const pauseUpload = useCallback((id: string) => {
    const uploader = uploadersRef.current.get(id);
    if (uploader) {
      uploader.pause();
    }
  }, []);

  const resumeUpload = useCallback((id: string) => {
    const uploader = uploadersRef.current.get(id);
    if (uploader) {
      uploader.resume();
    }
  }, []);

  const cancelUpload = useCallback((id: string) => {
    const uploader = uploadersRef.current.get(id);
    if (uploader) {
      uploader.cancel();
      uploadersRef.current.delete(id);
    }
    setUploads((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const retryUpload = useCallback(
    (id: string) => {
      const item = uploads.find((u) => u.id === id);
      if (!item) return;

      const uploader = new ChunkedUploader({
        file: item.file,
        folderId: item.folderId,
        onProgress: (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress } : u))
          );
        },
        onStateChange: (state, error) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, state, error } : u))
          );
        },
        onComplete: (fileData) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === id
                ? {
                    ...u,
                    state: "completed",
                    completedData: fileData,
                    progress: {
                      ...u.progress,
                      bytesUploaded: u.size,
                      percentage: 100,
                    },
                  }
                : u
            )
          );
          listenersRef.current.forEach((cb) => cb(fileData));
        },
        onError: (err) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, state: "error", error: err.message } : u
            )
          );
        },
      });

      uploadersRef.current.set(id, uploader);
      uploader.start();
    },
    [uploads]
  );

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((item) => item.state !== "completed"));
  }, []);

  const activeCount = uploads.filter(
    (item) =>
      item.state === "uploading" ||
      item.state === "initializing" ||
      item.state === "completing" ||
      item.state === "queued"
  ).length;

  return (
    <UploadContext.Provider
      value={{
        uploads,
        isDrawerOpen,
        isMinimized,
        setIsDrawerOpen,
        setIsMinimized,
        addFiles,
        pauseUpload,
        resumeUpload,
        cancelUpload,
        retryUpload,
        clearCompleted,
        activeCount,
        registerUploadListener,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
