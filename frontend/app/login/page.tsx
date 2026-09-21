"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder, ArrowRight, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import ThemeToggle from "@/components/ui/ThemeToggle";
import Captcha from "@/components/ui/Captcha";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemo } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedMsg, setDeletedMsg] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deleted") === "true") {
        setDeletedMsg(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Captcha
    if (!captchaInput.trim()) {
      setError("Please enter the security verification code.");
      return;
    }

    if (captchaInput.trim() !== challengeCode) {
      setError("Incorrect security verification code. Please try again.");
      setCaptchaInput("");
      setCaptchaRefreshKey((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email, password, rememberMe });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      setCaptchaInput("");
      setCaptchaRefreshKey((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/60 dark:bg-[#070a11] transition-colors relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to FileVault
        </Link>
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Folder className="h-5 w-5 fill-current" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
          Or{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
          >
            create a new FileVault account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900/90 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 sm:rounded-2xl sm:px-10">
          {deletedMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200/70 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Your account and all associated files have been permanently deleted.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200/70 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Alphanumeric Anti-Bot Captcha */}
            <div className="pt-1">
              <Captcha
                value={captchaInput}
                onChange={setCaptchaInput}
                onChallengeChange={setChallengeCode}
                refreshKey={captchaRefreshKey}
              />
            </div>

            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs text-slate-600 dark:text-slate-400"
              >
                Remember me
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center items-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
