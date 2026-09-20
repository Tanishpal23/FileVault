"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<{ success: boolean; message: string }>(
        "/api/auth/forgot-password",
        { email: email.trim() }
      );
      setInfoMessage(
        res.message || "A 6-digit verification code has been sent to your email."
      );
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<{ success: boolean; message: string }>(
        "/api/auth/forgot-password",
        { email: email.trim() }
      );
      setInfoMessage(res.message || "A new code has been sent to your email.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post<{ success: boolean; message: string }>(
        "/api/auth/reset-password",
        {
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }
      );
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The code may be expired.");
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
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            {step === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : step === "otp" ? (
              <KeyRound className="h-5 w-5" />
            ) : (
              <Folder className="h-5 w-5 fill-current" />
            )}
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {step === "success"
            ? "Password Reset Successful"
            : step === "otp"
            ? "Enter Verification Code"
            : "Reset your password"}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
          {step === "success"
            ? "Your password has been changed. You can now sign in with your new credentials."
            : step === "otp"
            ? `We sent a 6-digit code to ${email}`
            : "Enter your account's verified email address and we'll send you an OTP code to reset your password."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900/90 py-8 px-6 shadow-sm border border-slate-200/80 dark:border-slate-800 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200/70 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && step === "otp" && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200/70 p-3 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === "email" && (
            <form className="space-y-5" onSubmit={handleSendOtp}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === "otp" && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="otp"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Change email
                  </button>
                </div>
                <div className="mt-1.5">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    className="block w-full text-center tracking-[8px] font-mono text-base font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  New Password
                </label>
                <div className="mt-1.5">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm New Password
                </label>
                <div className="mt-1.5">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSubmitting}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      isSubmitting ? "animate-spin" : ""
                    }`}
                  />
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    otp.length !== 6 ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success */}
          {step === "success" && (
            <div className="text-center py-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                All set!
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your password has been securely updated. You can now log into your FileVault account.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
