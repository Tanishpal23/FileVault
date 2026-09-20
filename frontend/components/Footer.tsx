import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

const GithubIcon = ({ className = "w-3.5 h-3.5 inline-block" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-gray-200/80 bg-white/60 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-600 dark:text-slate-400">
        <p className="flex items-center gap-1.5 font-medium">
          Made with{" "}
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline-block animate-pulse" />{" "}
          by{" "}
          <Link
            href="https://github.com/Tanishpal23"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors inline-flex items-center gap-1"
          >
            Tanish
            <GithubIcon className="w-3.5 h-3.5 inline-block text-gray-700 hover:text-black dark:text-slate-300 dark:hover:text-white transition-colors" />
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
