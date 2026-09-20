"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (folderId: string) => void;
}

export default function Breadcrumbs({ breadcrumbs, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto py-1">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isRoot = crumb.id === "root";

        return (
          <React.Fragment key={crumb.id || idx}>
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-600" />
            )}
            <button
              type="button"
              onClick={() => onNavigate(crumb.id)}
              disabled={isLast}
              className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-colors cursor-pointer ${
                isLast
                  ? "font-semibold text-slate-900 dark:text-white cursor-default"
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800/60"
              }`}
            >
              {isRoot && <Home className="h-3.5 w-3.5" />}
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {crumb.name}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
