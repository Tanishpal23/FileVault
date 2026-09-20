"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Folder, FileText, Loader2, ArrowRight, X } from "lucide-react";
import { searchApi } from "@/lib/api";

export function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ files: any[]; folders: any[] }>({
    files: [],
    folders: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ files: [], folders: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search({ q: query.trim(), limit: 5 });
        setResults({
          files: res.files.slice(0, 5),
          folders: res.folders.slice(0, 3),
        });
        setIsOpen(true);
      } catch (err: any) {
        if (err?.status !== 401 && err?.code !== "NO_TOKEN") {
          console.warn("Global search preview failed", err);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectFile = (file: any) => {
    setIsOpen(false);
    // Navigate to parent folder or search view
    if (file.folderId) {
      router.push(`/dashboard?folderId=${file.folderId}`);
    } else {
      router.push(`/dashboard/search?q=${encodeURIComponent(file.name)}`);
    }
  };

  const handleSelectFolder = (folderId: string) => {
    setIsOpen(false);
    router.push(`/dashboard?folderId=${folderId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md hidden sm:block">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim()) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search files, folders..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800 transition-all"
        />

        {loading ? (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </form>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 zoom-in-95 duration-150">
          {results.folders.length === 0 && results.files.length === 0 && !loading ? (
            <p className="py-3 text-center text-xs text-slate-400">
              No matching files or folders found.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Folders */}
              {results.folders.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Folders
                  </div>
                  {results.folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleSelectFolder(folder.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <Folder className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500/20" />
                      <span className="truncate font-medium">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Files */}
              {results.files.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Files
                  </div>
                  {results.files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => handleSelectFile(file)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {file.folder?.name || "Root"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* View all results footer */}
              <button
                type="button"
                onClick={handleSubmit}
                className="flex w-full items-center justify-between rounded-lg border-t border-slate-100 px-2.5 pt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:border-slate-800 dark:text-indigo-400 cursor-pointer"
              >
                <span>Press Enter to see all results</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
