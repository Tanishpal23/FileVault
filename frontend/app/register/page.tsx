"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const { initiateRegister, verifySignup, resendSignupOtp } = useAuth();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState("");
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

  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter (A-Z)");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter (a-z)");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number (0-9)");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character (!@#$%^&*...)");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await initiateRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      setInfoMessage(res.message || "A 6-digit verification code has been sent to your email.");
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to initiate registration. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      await verifySignup({ email: email.trim(), otp: otp.trim() });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await resendSignupOtp(email.trim());
      setInfoMessage(res.message || "A new code has been sent to your email.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
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
            {step === "otp" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Folder className="h-5 w-5 fill-current" />
            )}
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {step === "otp" ? "Verify your email" : "Create your FileVault account"}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
          {step === "otp" ? (
            <>
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {email}
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
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
              <Mail className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: Registration Details */}
          {step === "form" && (
            <form className="space-y-4" onSubmit={handleInitiateSignup}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
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
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Include uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                      Sending verification code...
                    </>
                  ) : (
                    <>
                      Continue with Email
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Verification */}
          {step === "otp" && (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="otp"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setError(null);
                    }}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Change details
                  </button>
                </div>
                <div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="block w-full tracking-[0.5em] text-center font-mono text-xl font-bold rounded-lg border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Verification code expires in 10 minutes.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || otp.length !== 6}
                  className="flex w-full justify-center items-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying & activating account...
                    </>
                  ) : (
                    <>
                      Verify & Complete Signup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isSubmitting ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend verification code"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
