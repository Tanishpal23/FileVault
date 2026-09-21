"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Folder,
  Users,
  Share2,
  Star,
  Clock,
  Trash2,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  HardDrive,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { UploadProvider } from "@/context/UploadContext";
import UploadProgressDrawer from "@/components/upload/UploadProgressDrawer";
import UploadDropzoneOverlay from "@/components/upload/UploadDropzoneOverlay";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const navItems = [
    { name: "My Files", href: "/dashboard", icon: Folder },
    { name: "Shared with me", href: "/dashboard/shared-with-me", icon: Users },
    { name: "Shared by me", href: "/dashboard/shared-by-me", icon: Share2 },
    { name: "Starred", href: "/dashboard/starred", icon: Star },
    { name: "Recent", href: "/dashboard/recent", icon: Clock },
    { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr) || 0;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const usedBytes = Number(user?.storageUsed || "0");
  const totalBytes = Number(user?.storageQuota || "1073741824");
  const percentUsed = Math.min(100, Math.round((usedBytes / totalBytes) * 100));

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#070a11]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading FileVault...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UploadProvider>
      <div className="flex h-screen bg-slate-50/50 dark:bg-[#070a11] overflow-hidden transition-colors">
        <UploadDropzoneOverlay />
        <UploadProgressDrawer />
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/95 transition-colors">
        <div className="space-y-6">
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Folder className="h-4 w-4 fill-current" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              FileVault
            </span>
          </a>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/dashboard" && pathname === "/dashboard/files");
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-400"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Storage Widget & Logout */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Storage
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {percentUsed}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {formatBytes(usedBytes.toString())} of{" "}
              {formatBytes(totalBytes.toString())} used
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-64 flex-1 flex-col justify-between bg-white dark:bg-slate-900 p-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <a href="/dashboard" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Folder className="h-4 w-4 fill-current" />
                  </div>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    FileVault
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-400"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 dark:border-slate-800/80 dark:bg-slate-900/95 transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar */}
            <GlobalSearchBar />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Header Dark Mode Toggle Button */}
            <ThemeToggle />

            {/* Realtime Notification Bell */}
            <NotificationBell />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="hidden sm:block text-xs font-medium text-slate-800 dark:text-slate-200">
                  {user?.name || "Rahul Sharma"}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 dark:border-slate-800 dark:bg-slate-900">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {user?.name || "Rahul Sharma"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || "rahul@example.com"}
                    </p>
                  </div>
                  <div className="py-1">
                    <a
                      href="/dashboard/settings"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                      Account Settings
                    </a>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 flex flex-col overflow-y-auto dark:bg-[#090d16] transition-colors">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
    </UploadProvider>
  );
}
