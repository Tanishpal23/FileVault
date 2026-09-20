"use client";

import React from "react";
import { CloudUpload, Folder, ShieldCheck, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: "Upload",
      description: "Upload your files directly to your secure cloud workspace.",
      icon: CloudUpload,
    },
    {
      step: 2,
      title: "Organize & Share",
      description:
        "Create folders, manage permissions, and share files with your team.",
      icon: Folder,
    },
    {
      step: 3,
      title: "Manage",
      description:
        "Track versions, activity, storage, and recover deleted files.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-20 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div>
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-400">
            <span className="tracking-wide uppercase">HOW IT WORKS</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Get started in 3 simple steps.
          </h2>

          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
            Set up, upload, and start sharing your files in minutes.
          </p>
        </div>

        {/* 3 Step Cards Connected with Arrows */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Step indicator + Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-xs font-bold text-white shadow-xs">
                      {item.step}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator between steps for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                    <ArrowRight className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
