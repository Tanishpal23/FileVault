"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  Share2,
  MessageSquare,
  History,
  FileText,
  Trash2,
  FolderPlus,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { activityApi, ActivityItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function ActivityFeed() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await activityApi.list(10, 0);
      setActivities(res.activities || []);
    } catch (err: any) {
      if (err?.status !== 401 && err?.code !== "NO_TOKEN") {
        console.warn("Could not load activity logs:", err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      setActivities([]);
      setIsLoading(false);
      return;
    }
    fetchActivities();
  }, [user?.id, authLoading]);

  const getActionDetails = (action: string) => {
    switch (action) {
      case "FILE_UPLOADED":
        return {
          icon: <Upload className="w-3.5 h-3.5 text-blue-500" />,
          label: "Uploaded",
          bgColor: "bg-blue-50 dark:bg-blue-950/40",
        };
      case "FILE_DOWNLOADED":
        return {
          icon: <Download className="w-3.5 h-3.5 text-emerald-500" />,
          label: "Downloaded",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        };
      case "FILE_SHARED":
        return {
          icon: <Share2 className="w-3.5 h-3.5 text-indigo-500" />,
          label: "Shared",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
        };
      case "COMMENT_ADDED":
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-purple-500" />,
          label: "Commented on",
          bgColor: "bg-purple-50 dark:bg-purple-950/40",
        };
      case "VERSION_UPLOADED":
      case "VERSION_RESTORED":
        return {
          icon: <History className="w-3.5 h-3.5 text-amber-500" />,
          label: action === "VERSION_RESTORED" ? "Restored version of" : "Updated version of",
          bgColor: "bg-amber-50 dark:bg-amber-950/40",
        };
      case "FILE_DELETED":
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
          label: "Moved to trash",
          bgColor: "bg-rose-50 dark:bg-rose-950/40",
        };
      case "FOLDER_CREATED":
        return {
          icon: <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />,
          label: "Created folder",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
        };
      default:
        return {
          icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
          label: "Updated",
          bgColor: "bg-slate-50 dark:bg-slate-800/40",
        };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Recent Activity
          </h3>
        </div>
        <button
          onClick={fetchActivities}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh activity feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading && activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading audit trail...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No recent activity yet. Upload or share a file to get started!
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => {
            const { icon, label, bgColor } = getActionDetails(item.action);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 text-xs group py-1"
              >
                <div
                  className={`p-2 rounded-xl ${bgColor} shrink-0 flex items-center justify-center`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 dark:text-slate-300 truncate">
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      {label}{" "}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.resourceName}
                    </span>
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
