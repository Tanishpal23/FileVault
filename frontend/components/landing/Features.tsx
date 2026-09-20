"use client";

import React from "react";
import {
  CloudUpload,
  Users,
  History,
  ShieldCheck,
  Check,
} from "lucide-react";
import UploadProgressCard from "./UploadProgressCard";

export default function Features() {
  const featureCards = [
    {
      title: "Fast & Reliable Uploads",
      description:
        "Upload large files with progress tracking and resumable uploads.",
      icon: CloudUpload,
      bullets: ["Multipart uploads", "Retry support"],
    },
    {
      title: "Share With Control",
      description:
        "Share files with people or create links with permissions and expiration dates.",
      icon: Users,
      bullets: ["User-to-user sharing", "Public links"],
    },
    {
      title: "Version History",
      description:
        "Keep previous versions and restore files when needed.",
      icon: History,
      bullets: ["Track changes", "Restore older versions"],
    },
    {
      title: "Secure Storage",
      description:
        "Granular access controls and activity tracking keep your data safe.",
      icon: ShieldCheck,
      bullets: ["Access control", "Encrypted transfers"],
    },
  ];

  return (
    <section id="features" className="py-16 lg:py-20 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#090d16] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Row: Split between copy on left and Upload Progress on right */}
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-400">
              <span className="tracking-wide uppercase">WHY FILEVAULT</span>
            </div>

            {/* Heading */}
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to manage your files.
            </h2>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
              A simple workspace for uploading, organizing, sharing, and keeping
              control of your files.
            </p>
          </div>

          <div className="lg:col-span-5 flex justify-start lg:justify-end">
            <UploadProgressCard />
          </div>
        </div>

        {/* 4 Feature Cards in a Row */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-500/40 dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between"
              >
                <div>
                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {card.description}
                  </p>
                </div>

                {/* Bullets */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {card.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
