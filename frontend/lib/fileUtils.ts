/**
 * File utility helpers for MIME inference, extension resolution, and preview classification
 */

const TEXT_AND_CODE_EXTENSIONS = new Set([
  // Web & UI
  "js", "jsx", "ts", "tsx", "mjs", "cjs", "vue", "svelte", "html", "htm", "css", "scss", "sass", "less",
  // Data & Configuration
  "json", "jsonc", "xml", "yaml", "yml", "toml", "ini", "conf", "config", "env", "properties", "plist",
  // Documents & Plain Text
  "txt", "md", "markdown", "csv", "tsv", "log", "diff", "patch",
  // Backend & Systems Programming
  "py", "pyw", "java", "c", "cpp", "cc", "cxx", "h", "hpp", "hh", "hxx",
  "cs", "csx", "go", "rs", "php", "phtml", "rb", "erb", "rake", "swift",
  "kt", "kts", "dart", "scala", "lua", "r", "pl", "pm",
  // Shell & Scripts
  "sh", "bash", "zsh", "fish", "bat", "cmd", "ps1", "psm1",
  // Query & Database
  "sql", "prisma", "graphql", "gql",
  // Project & Build metadata
  "dockerfile", "svg", "gitignore", "gitattributes", "editorconfig", "npmrc"
]);

const EXACT_TEXT_FILENAMES = new Set([
  "dockerfile", "makefile", "license", "readme", "procfile", "gemfile",
  "vagrantfile", ".env", ".gitignore", ".gitattributes", ".editorconfig",
  ".prettierrc", ".eslintrc", ".babelrc", ".npmrc", "caddyfile"
]);

const EXTENSION_MIME_MAP: Record<string, string> = {
  ts: "text/typescript",
  tsx: "text/typescript-jsx",
  js: "application/javascript",
  jsx: "text/jsx",
  json: "application/json",
  jsonc: "application/json",
  md: "text/markdown",
  markdown: "text/markdown",
  txt: "text/plain",
  py: "text/x-python",
  c: "text/x-c",
  cpp: "text/x-c++src",
  h: "text/x-chdr",
  hpp: "text/x-c++hdr",
  cs: "text/x-csharp",
  java: "text/x-java-source",
  go: "text/x-go",
  rs: "text/x-rustsrc",
  php: "text/x-php",
  rb: "text/x-ruby",
  swift: "text/x-swift",
  kt: "text/x-kotlin",
  sql: "application/sql",
  sh: "application/x-sh",
  bash: "application/x-sh",
  zsh: "application/x-sh",
  env: "text/plain",
  yml: "text/yaml",
  yaml: "text/yaml",
  xml: "application/xml",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  scss: "text/x-scss",
  sass: "text/x-sass",
  less: "text/x-less",
  vue: "text/x-vue",
  svelte: "text/x-svelte",
  toml: "text/x-toml",
  ini: "text/plain",
  conf: "text/plain",
  log: "text/plain",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  svg: "image/svg+xml",
};

/**
 * Checks if a file is text or source code based on its filename and MIME type
 */
export function isTextOrCodeFile(name: string, mimeType?: string): boolean {
  if (mimeType) {
    const m = mimeType.toLowerCase();
    if (
      m.startsWith("text/") ||
      m.includes("json") ||
      m.includes("javascript") ||
      m.includes("typescript") ||
      m.includes("xml") ||
      m.includes("html") ||
      m.includes("yaml") ||
      m.includes("markdown") ||
      m.includes("csv")
    ) {
      return true;
    }
  }

  const cleanName = name.trim().toLowerCase();
  if (EXACT_TEXT_FILENAMES.has(cleanName)) {
    return true;
  }

  const parts = cleanName.split(".");
  if (parts.length > 1) {
    const ext = parts.pop()!;
    if (TEXT_AND_CODE_EXTENSIONS.has(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Infers a clean MIME type from filename if the browser provided an empty or generic one
 */
export function inferMimeType(filename: string, browserMime?: string): string {
  if (
    browserMime &&
    browserMime.trim() !== "" &&
    browserMime !== "application/octet-stream"
  ) {
    return browserMime;
  }

  const cleanName = filename.trim().toLowerCase();
  const ext = cleanName.split(".").pop();
  if (ext && EXTENSION_MIME_MAP[ext]) {
    return EXTENSION_MIME_MAP[ext];
  }

  if (EXACT_TEXT_FILENAMES.has(cleanName)) {
    return "text/plain";
  }

  return browserMime || "application/octet-stream";
}
