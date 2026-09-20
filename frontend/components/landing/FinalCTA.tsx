"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-[#090d16] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-blue-50/70 p-8 sm:p-12 lg:p-14 dark:border-slate-800 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            {/* Left Content */}
            <div className="md:col-span-6 lg:col-span-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ready to organize your files?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md">
                Store, share, and manage your files from one simple workspace.
              </p>
            </div>

            {/* Middle Button */}
            <div className="md:col-span-3 lg:col-span-3 flex md:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right Graphic: Stylized Folder & Documents Illustration */}
            <div className="md:col-span-3 lg:col-span-3 flex justify-center md:justify-end">
              <div className="relative w-36 h-28 sm:w-44 sm:h-32 flex items-center justify-center">
                {/* Floating Sheet 1 */}
                <div className="absolute top-1 left-2 h-20 w-24 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-slate-700 shadow-sm rotate-[-8deg] flex flex-col p-2 space-y-1.5 opacity-90">
                  <div className="h-1.5 w-10 bg-indigo-200 dark:bg-indigo-400/60 rounded-full" />
                  <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
                  <div className="h-1.5 w-12 bg-slate-100 dark:bg-slate-700 rounded-full" />
                </div>

                {/* Floating Sheet 2 */}
                <div className="absolute top-2 right-1 h-20 w-24 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 shadow-sm rotate-[10deg] flex flex-col p-2 space-y-1.5 opacity-95">
                  <div className="h-1.5 w-8 bg-indigo-300 dark:bg-indigo-400 rounded-full" />
                  <div className="h-1.5 w-14 bg-slate-100 dark:bg-slate-700 rounded-full" />
                  <div className="h-1.5 w-10 bg-slate-100 dark:bg-slate-700 rounded-full" />
                </div>

                {/* Front Hero Folder */}
                <div className="relative z-10 h-24 w-32 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-8 bg-indigo-400 rounded-sm" />
                    <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
                  </div>
                  <div className="rounded-lg bg-indigo-700/50 p-2 text-white/90">
                    <div className="h-1.5 w-12 bg-white/80 rounded-full" />
                    <div className="mt-1 h-1 w-16 bg-white/40 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
