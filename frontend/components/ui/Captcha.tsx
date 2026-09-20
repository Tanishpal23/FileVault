"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCw, ShieldCheck } from "lucide-react";

interface CaptchaProps {
  value: string;
  onChange: (val: string) => void;
  onChallengeChange?: (code: string) => void;
  refreshKey?: number;
}

// Clear alphanumeric set excluding visually ambiguous characters (0, O, 1, l, I)
const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

export default function Captcha({
  value,
  onChange,
  onChallengeChange,
  refreshKey = 0,
}: CaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState("");
  const [isRotating, setIsRotating] = useState(false);

  // Generate 6 random alphanumeric characters
  const generateCode = useCallback(() => {
    let result = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * CAPTCHA_CHARS.length);
      result += CAPTCHA_CHARS[randomIndex];
    }
    return result;
  }, []);

  // Draw the code on canvas with anti-bot distortions
  const drawCaptcha = useCallback((code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const isDark = document.documentElement.classList.contains("dark");
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    if (isDark) {
      bgGradient.addColorStop(0, "#1e293b");
      bgGradient.addColorStop(1, "#0f172a");
    } else {
      bgGradient.addColorStop(0, "#f8fafc");
      bgGradient.addColorStop(1, "#e2e8f0");
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Random interference lines
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.strokeStyle = isDark
        ? `rgba(148, 163, 184, ${0.25 + Math.random() * 0.25})`
        : `rgba(100, 116, 139, ${0.25 + Math.random() * 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Random background dots
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 1.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = isDark
        ? "rgba(148, 163, 184, 0.4)"
        : "rgba(100, 116, 139, 0.4)";
      ctx.fill();
    }

    // Draw characters with random rotational angles and colors
    const colors = isDark
      ? ["#818cf8", "#38bdf8", "#4ade80", "#fbbf24", "#f472b6", "#a78bfa"]
      : ["#4338ca", "#0284c7", "#15803d", "#b45309", "#be185d", "#6d28d9"];

    const charSpacing = width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = (i + 1) * charSpacing;
      const y = height / 2 + Math.random() * 6 - 3;
      const angle = ((Math.random() - 0.5) * 35 * Math.PI) / 180; // -17.5° to +17.5°

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const fontWeights = ["bold", "600", "700"];
      const randomWeight =
        fontWeights[Math.floor(Math.random() * fontWeights.length)];
      ctx.font = `${randomWeight} 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, []);

  const refreshCaptcha = useCallback(() => {
    setIsRotating(true);
    const newCode = generateCode();
    setCaptchaCode(newCode);
    drawCaptcha(newCode);
    if (onChallengeChange) {
      onChallengeChange(newCode);
    }
    setTimeout(() => setIsRotating(false), 400);
  }, [generateCode, drawCaptcha, onChallengeChange]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="captchaInput"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
          <span>Security Verification</span>
        </label>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Letters & numbers (case-sensitive)
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Canvas Display */}
        <div className="relative overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs select-none">
          <canvas
            ref={canvasRef}
            width={160}
            height={40}
            className="block cursor-pointer"
            onClick={refreshCaptcha}
            title="Click to generate new code"
          />
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={refreshCaptcha}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          title="Refresh Captcha Code"
        >
          <RotateCw
            className={`h-4 w-4 transition-transform duration-400 ${
              isRotating ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Captcha Input */}
        <div className="relative flex-1">
          <input
            id="captchaInput"
            name="captcha"
            type="text"
            required
            maxLength={6}
            value={value}
            onChange={(e) => onChange(e.target.value.trim().slice(0, 6))}
            placeholder="Enter code"
            autoComplete="off"
            spellCheck={false}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}
