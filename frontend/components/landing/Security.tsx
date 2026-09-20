"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileKey,
  RotateCcw,
  CheckCircle2,
  Server,
  Fingerprint,
} from "lucide-react";

export default function Security() {
  const securityPillars = [
    {
      title: "Short-Lived Signed URLs",
      description:
        "Files stream directly to and from secure storage using presigned tokens that automatically expire within 60 minutes. Raw bucket credentials never touch the client.",
      icon: KeyRound,
      badge: "Zero Exposure",
    },
    {
      title: "Granular RBAC & Permissions",
      description:
        "Enforce strict role-based access controls across your team. Assign Owner, Editor, Commenter, or Viewer roles with real-time revocation capabilities.",
      icon: Lock,
      badge: "Role-Based",
    },
    {
      title: "Protected Share Links",
      description:
        "Generate public links with mandatory bcrypt-hashed passwords, automated expiration timers, and download limits for secure external collaboration.",
      icon: FileKey,
      badge: "Password Protected",
    },
    {
      title: "Tamper-Evident History & Trash",
      description:
        "Every file revision is preserved in immutable snapshot versions. Deleted files enter a 30-day soft-delete buffer with one-click instant recovery.",
      icon: RotateCcw,
      badge: "30-Day Recovery",
    },
  ];

  const complianceBadges = [
    { label: "AES-256 Storage", desc: "Encrypted at rest" },
    { label: "TLS 1.3 Transit", desc: "End-to-end wire encryption" },
    { label: "HTTP-Only Cookies", desc: "XSS-hardened JWT tokens" },
    { label: "SHA-256 Checksums", desc: "Bit-level integrity validation" },
  ];

  return (
    <section
      id="security"
      className="py-16 lg:py-24 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="tracking-wide uppercase">ENTERPRISE SECURITY</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Zero-compromise security for your mission-critical data.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Engineered from day one with defense-in-depth architecture, ephemeral presigned access, and cryptographically verified storage.
          </p>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {securityPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-indigo-300 dark:hover:border-indigo-900/60 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    {pillar.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enforced by policy</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Specs Bar */}
        <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {complianceBadges.map((badge) => (
              <div key={badge.label} className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {badge.label}
                </span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {badge.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
