"use client";

import React from "react";
import Link from "next/link";
import { Check, Sparkles, Clock, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Community",
      status: "Available Now",
      isLive: true,
      price: "$0",
      cadence: "forever free",
      description: "Complete cloud file vault for personal productivity and individuals.",
      features: [
        "5 GB Cloud Storage included",
        "Resumable chunked file uploads",
        "Multi-format document & media previewer",
        "Real-time comments & collaborator mentions",
        "Password-protected public share links",
        "Historical versioning (up to 3 versions)",
        "30-day soft-delete trash recovery",
      ],
      ctaText: "Get Started Free",
      ctaHref: "/register",
      popular: false,
    },
    {
      name: "Professional",
      status: "Coming Soon",
      isLive: false,
      price: "$1",
      cadence: "per user / month",
      description: "Designed for power users, creators, and fast-moving teams.",
      features: [
        "1 TB High-speed Cloud Storage",
        "Unlimited file version history & diffs",
        "Custom link branding & domain aliases",
        "Collaborator role permission auditing",
        "Priority background processing queue",
        "Advanced full-text search with regex",
        "Real-time activity webhooks & exports",
      ],
      ctaText: "Join Pro Waitlist",
      ctaHref: "#pricing",
      popular: true,
    },
    {
      name: "Enterprise",
      status: "Coming Soon",
      isLive: false,
      price: "Custom",
      cadence: "tailored for organizations",
      description: "Dedicated infrastructure, custom buckets, and enterprise compliance.",
      features: [
        "Unlimited scalable storage capacity",
        "BYOB (Bring Your Own Cloudflare R2 / S3 Bucket)",
        "SAML 2.0 & Okta / Google SSO integration",
        "Dedicated isolated database instances",
        "HIPAA & SOC 2 compliance readiness",
        "99.99% uptime SLA guarantee",
        "24/7 dedicated engineering support",
      ],
      ctaText: "Contact Enterprise Sales",
      ctaHref: "mailto:sales@filevault.local?subject=Enterprise%20Plan%20Inquiry",
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 lg:py-24 bg-white dark:bg-[#090d16] border-t border-slate-100 dark:border-slate-800 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Zap className="h-3.5 w-3.5" />
            <span className="tracking-wide uppercase">TRANSPARENT PLANS</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Simple, predictable pricing for every stage.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Start completely free with zero credit card required. Upgrade when your storage and collaboration needs expand.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all ${
                plan.popular
                  ? "border-2 border-indigo-600 bg-white shadow-xl shadow-indigo-600/10 dark:border-indigo-500 dark:bg-slate-900"
                  : "border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3.5 py-1 text-[11px] font-bold tracking-wide uppercase text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                {/* Header Row: Name & Status */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      plan.isLive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60"
                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60"
                    }`}
                  >
                    {!plan.isLive && <Clock className="h-3 w-3" />}
                    {plan.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 min-h-[32px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mt-5 flex items-baseline gap-1.5 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {plan.cadence}
                  </span>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    What&apos;s included
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom CTA Button */}
              <div className="mt-8 pt-4">
                {plan.isLive ? (
                  <Link
                    href={plan.ctaHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  >
                    <span>{plan.ctaText}</span>
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>All data encrypted with AES-256. Cancel or export your files anytime.</span>
        </div>
      </div>
    </section>
  );
}
