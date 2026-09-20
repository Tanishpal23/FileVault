"use client";

import React from "react";
import {
  CloudCheck,
  Users,
  History,
  CloudUpload,
  Link2,
  BarChart3,
} from "lucide-react";

export default function CapabilityBar() {
  const capabilities = [
    {
      label: "Secure uploads",
      icon: CloudCheck,
    },
    {
      label: "Granular permissions",
      icon: Users,
    },
    {
      label: "Version history",
      icon: History,
    },
    {
      label: "Direct-to-cloud",
      icon: CloudUpload,
    },
    {
      label: "Public sharing",
      icon: Link2,
    },
    {
      label: "Activity tracking",
      icon: BarChart3,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-6 py-4 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-2">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 py-1"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
