"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User as UserIcon,
  Mail,
  HardDrive,
  AlertTriangle,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user, deleteAccount } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatBytes = (bytesStr?: string) => {
    const bytes = Number(bytesStr) || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const usedBytes = Number(user?.storageUsed || "0");
  const totalBytes = Number(user?.storageQuota || "10737418240");
  const percentUsed = Math.min(100, Math.round((usedBytes / totalBytes) * 100));

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      setError("Please type DELETE in capital letters to confirm.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteAccount(password);
      router.push("/login?deleted=true");
    } catch (err: any) {
      setError(err?.message || "Failed to delete account. Please verify your password.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your account credentials and system preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-indigo-500" />
          Account Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-lg font-bold text-white shadow-md">
              {user?.name?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-base">
                {user?.name || "User"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email || "No email"}</span>
              </div>
            </div>
          </div>

          {/* Storage Mini Gauge */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-indigo-500" />
                Storage Usage
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {percentUsed}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              {formatBytes(user?.storageUsed)} of {formatBytes(user?.storageQuota)} used
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50/20 p-6 dark:border-red-900/40 dark:bg-red-950/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Deleting your account is permanent. All your files, folders, shared links, comments, and version histories will be immediately and irreversibly wiped from FileVault and cloud storage.
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setPassword("");
                  setConfirmText("");
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 transition-all active:scale-98 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Delete Account Permanently?
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              All files, shared links, activity logs, and personal data will be immediately and irreversibly deleted.
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleDelete} className="space-y-4">
              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter your password to verify:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your account password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Text Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type <span className="text-red-600 dark:text-red-400 font-bold font-mono">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || confirmText !== "DELETE" || !password}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
