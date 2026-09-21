"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  History,
  HardDrive,
} from "lucide-react";
import ProductPreview from "./ProductPreview";

export default function Hero() {
  return (
    <section id="product" className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 bg-white dark:bg-[#090d16] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 xl:col-span-5">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
              <span className="tracking-wide uppercase">
                SECURE CLOUD FILE MANAGEMENT
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[50px] lg:leading-[1.12]">
              Your files. Organized, secure, and always{" "}
              <span className="text-indigo-600 dark:text-indigo-400">within reach.</span>
            </h1>

            {/* Description */}
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Upload, organize, share, and collaborate on files with secure cloud
              storage built for speed and control.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Explore workspace
              </Link>
            </div>

            {/* Small Benefit Row */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Secure uploads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Granular permissions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Version history</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>1 GB free storage</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Realistic Product Preview */}
          <div
            id="product"
            className="lg:col-span-6 xl:col-span-7 w-full max-w-2xl mx-auto lg:max-w-none"
          >
            <ProductPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
