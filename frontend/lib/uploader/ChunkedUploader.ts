import { inferMimeType } from "../fileUtils";

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  speedBytesPerSec: number;
  etaSeconds: number;
}

export type UploadState =
  | "queued"
  | "initializing"
  | "uploading"
  | "paused"
  | "completing"
  | "completed"
  | "error"
  | "aborted";

export interface ChunkedUploaderOptions {
  file: File;
  folderId?: string | null;
  apiUrl?: string;
  chunkSize?: number; // default 5MB
  maxConcurrency?: number; // default 2
  onProgress?: (progress: UploadProgress) => void;
  onStateChange?: (state: UploadState, error?: string) => void;
  onComplete?: (fileData: any) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_CONCURRENCY = 2;
const DIRECT_UPLOAD_THRESHOLD = 5 * 1024 * 1024; // <= 5MB uploads direct

export class ChunkedUploader {
  public file: File;
  public folderId?: string | null;
  public apiUrl: string;
  public chunkSize: number;
  public maxConcurrency: number;

  public uploadSessionId: string | null = null;
  public state: UploadState = "queued";
  public error: Error | null = null;

  private onProgress?: (progress: UploadProgress) => void;
  private onStateChange?: (state: UploadState, error?: string) => void;
  private onComplete?: (fileData: any) => void;
  private onError?: (error: Error) => void;

  private abortControllers: Map<number, AbortController> = new Map();
  private uploadedParts: Map<number, { etag: string; size: number }> = new Map();
  private totalParts = 1;
  private isPaused = false;
  private isAborted = false;

  // Speed calculation
  private startTime = 0;
  private lastUpdateTime = 0;
  private lastBytesUploaded = 0;
  private currentSpeed = 0;

  constructor(options: ChunkedUploaderOptions) {
    this.file = options.file;
    this.folderId = options.folderId;
    this.apiUrl = (
      options.apiUrl ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000"
    ).replace(/\/$/, "");
    this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    this.maxConcurrency = options.maxConcurrency || DEFAULT_CONCURRENCY;
    this.onProgress = options.onProgress;
    this.onStateChange = options.onStateChange;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  private getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extraHeaders };
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("filevault_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private setState(state: UploadState, errorMsg?: string) {
    this.state = state;
    this.onStateChange?.(state, errorMsg);
  }

  private getStorageKey(): string {
    return `filevault_upload_${this.file.name}_${this.file.size}_${this.folderId || "root"}`;
  }

  private saveSessionToStorage(sessionId: string) {
    try {
      localStorage.setItem(
        this.getStorageKey(),
        JSON.stringify({
          sessionId,
          filename: this.file.name,
          size: this.file.size,
          folderId: this.folderId,
          savedAt: Date.now(),
        })
      );
    } catch {
      // Ignore localStorage errors
    }
  }

  private clearSessionFromStorage() {
    try {
      localStorage.removeItem(this.getStorageKey());
    } catch {
      // Ignore
    }
  }

  private getCachedSession(): string | null {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Valid if less than 24 hours old
      if (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
        return parsed.sessionId;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Start or resume the upload
   */
  async start() {
    this.isPaused = false;
    this.isAborted = false;
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    this.lastBytesUploaded = 0;

    try {
      // If file is small, use fast direct upload
      if (this.file.size <= DIRECT_UPLOAD_THRESHOLD) {
        await this.uploadDirect();
        return;
      }

      // Check if we have an existing session to resume
      const cachedSessionId = this.getCachedSession();
      if (cachedSessionId) {
        const canResume = await this.tryResume(cachedSessionId);
        if (canResume) return;
      }

      // Otherwise, initialize a fresh multipart upload
      await this.initiateMultipart();
    } catch (err: any) {
      if (this.isPaused) return;
      this.error = err;
      this.setState("error", err.message);
      this.onError?.(err);
    }
  }

  /**
   * Fast path for small files (<= 5MB)
   */
  private async uploadDirect() {
    this.setState("uploading");

    const formData = new FormData();
    formData.append("file", this.file);
    if (this.folderId) {
      formData.append("folderId", this.folderId);
    }

    const xhr = new XMLHttpRequest();
    const abortCtrl = new AbortController();
    this.abortControllers.set(0, abortCtrl);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        this.emitProgress(event.loaded, event.total);
      }
    });

    const response = await new Promise<any>((resolve, reject) => {
      xhr.open("POST", `${this.apiUrl}/api/uploads/direct`, true);
      xhr.withCredentials = true;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || localStorage.getItem("filevault_token")
          : null;
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.data);
          } catch (e) {
            reject(new Error("Invalid response format"));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error?.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network connection error"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      abortCtrl.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(formData);
    });

    this.emitProgress(this.file.size, this.file.size);
    this.setState("completed");
    this.onComplete?.(response);
  }

  /**
   * Initiate multipart upload session
   */
  private async initiateMultipart() {
    this.setState("initializing");

    const res = await fetch(`${this.apiUrl}/api/uploads/initiate`, {
      method: "POST",
      credentials: "include",
      headers: this.getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        filename: this.file.name,
        mimeType: inferMimeType(this.file.name, this.file.type),
        fileSize: this.file.size,
        folderId: this.folderId || null,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Failed to initialize multipart upload");
    }

    const { data } = await res.json();
    this.uploadSessionId = data.uploadSessionId;
    this.totalParts = data.totalParts;
    this.chunkSize = data.chunkSize;
    this.saveSessionToStorage(data.uploadSessionId);

    await this.processChunks();
  }

  /**
   * Resume an existing upload session
   */
  private async tryResume(sessionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiUrl}/api/uploads/${sessionId}/status`, {
        credentials: "include",
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return false;

      const { data } = await res.json();
      if (data.status === "COMPLETED") {
        this.clearSessionFromStorage();
        return false;
      }

      this.uploadSessionId = sessionId;
      this.totalParts = data.totalParts;
      this.chunkSize = data.chunkSize;

      // Populate already uploaded parts
      for (const part of data.uploadedParts) {
        this.uploadedParts.set(part.partNumber, { etag: part.etag, size: part.size });
      }

      await this.processChunks();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Chunk processing queue with concurrency control
   */
  private async processChunks() {
    this.setState("uploading");

    const pendingPartNumbers: number[] = [];
    for (let i = 1; i <= this.totalParts; i++) {
      if (!this.uploadedParts.has(i)) {
        pendingPartNumbers.push(i);
      }
    }

    if (pendingPartNumbers.length === 0) {
      await this.completeMultipart();
      return;
    }

    let currentIndex = 0;
    const workers = Array.from({ length: this.maxConcurrency }, async () => {
      while (currentIndex < pendingPartNumbers.length && !this.isPaused && !this.isAborted) {
        const partNumber = pendingPartNumbers[currentIndex++];
        await this.uploadPartWithRetry(partNumber);
      }
    });

    await Promise.all(workers);

    if (this.isPaused) {
      this.setState("paused");
      return;
    }

    if (this.isAborted) {
      this.setState("aborted");
      return;
    }

    if (this.uploadedParts.size === this.totalParts) {
      await this.completeMultipart();
    }
  }

  /**
   * Upload a single part with exponential backoff retry (up to 3 retries)
   */
  private async uploadPartWithRetry(partNumber: number, maxRetries = 3): Promise<void> {
    let attempt = 0;
    while (attempt < maxRetries) {
      if (this.isPaused || this.isAborted) return;
      try {
        await this.uploadPart(partNumber);
        return;
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Upload an individual part chunk
   */
  private async uploadPart(partNumber: number): Promise<void> {
    if (!this.uploadSessionId) throw new Error("No active session");

    // 1. Get presigned part URL
    const urlRes = await fetch(
      `${this.apiUrl}/api/uploads/${this.uploadSessionId}/parts/${partNumber}/url`,
      {
        credentials: "include",
        headers: this.getAuthHeaders(),
      }
    );
    if (!urlRes.ok) {
      throw new Error(`Failed to get URL for part ${partNumber}`);
    }
    const { data } = await urlRes.json();
    const partUrl = data.url;

    // 2. Slice slice file chunk
    const start = (partNumber - 1) * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);
    const chunkSize = chunk.size;

    // 3. Upload chunk to part URL via PUT
    const abortCtrl = new AbortController();
    this.abortControllers.set(partNumber, abortCtrl);

    const putRes = await fetch(partUrl, {
      method: "PUT",
      body: chunk,
      signal: abortCtrl.signal,
    });

    this.abortControllers.delete(partNumber);

    if (!putRes.ok) {
      throw new Error(`Failed to upload chunk ${partNumber} (status ${putRes.status})`);
    }

    // Capture ETag from response headers or fallback
    const rawEtag = putRes.headers.get("ETag") || `"part-${partNumber}"`;
    const etag = rawEtag.replace(/"/g, "");

    // 4. Record part completion on backend
    const recordRes = await fetch(
      `${this.apiUrl}/api/uploads/${this.uploadSessionId}/parts/${partNumber}/complete`,
      {
        method: "POST",
        credentials: "include",
        headers: this.getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ etag: `"${etag}"`, size: chunkSize }),
      }
    );

    if (!recordRes.ok) {
      throw new Error(`Failed to record part ${partNumber}`);
    }

    this.uploadedParts.set(partNumber, { etag: `"${etag}"`, size: chunkSize });

    // Update progress
    let totalUploaded = 0;
    this.uploadedParts.forEach((p) => (totalUploaded += p.size));
    this.emitProgress(totalUploaded, this.file.size);
  }

  /**
   * Complete multipart upload
   */
  private async completeMultipart() {
    this.setState("completing");

    const parts = Array.from(this.uploadedParts.entries())
      .map(([partNumber, { etag }]) => ({ partNumber, etag }))
      .sort((a, b) => a.partNumber - b.partNumber);

    const res = await fetch(`${this.apiUrl}/api/uploads/${this.uploadSessionId}/complete`, {
      method: "POST",
      credentials: "include",
      headers: this.getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        folderId: this.folderId || null,
        parts,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Failed to complete upload");
    }

    const { data } = await res.json();
    this.clearSessionFromStorage();
    this.emitProgress(this.file.size, this.file.size);
    this.setState("completed");
    this.onComplete?.(data);
  }

  /**
   * Pause upload
   */
  pause() {
    this.isPaused = true;
    for (const ctrl of this.abortControllers.values()) {
      ctrl.abort();
    }
    this.abortControllers.clear();
    this.setState("paused");
  }

  /**
   * Resume upload
   */
  resume() {
    if (this.state === "paused") {
      this.start();
    }
  }

  /**
   * Cancel and abort upload
   */
  async cancel() {
    this.isAborted = true;
    this.isPaused = true;

    for (const ctrl of this.abortControllers.values()) {
      ctrl.abort();
    }
    this.abortControllers.clear();

    if (this.uploadSessionId) {
      try {
        await fetch(`${this.apiUrl}/api/uploads/${this.uploadSessionId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch {
        // Ignore
      }
      this.clearSessionFromStorage();
    }

    this.setState("aborted");
  }

  private emitProgress(loaded: number, total: number) {
    const now = Date.now();
    const timeDelta = (now - this.lastUpdateTime) / 1000;

    if (timeDelta > 0.5 || loaded === total) {
      const bytesDelta = loaded - this.lastBytesUploaded;
      this.currentSpeed = timeDelta > 0 ? Math.round(bytesDelta / timeDelta) : 0;
      this.lastUpdateTime = now;
      this.lastBytesUploaded = loaded;
    }

    const remainingBytes = Math.max(0, total - loaded);
    const etaSeconds = this.currentSpeed > 0 ? Math.ceil(remainingBytes / this.currentSpeed) : 0;
    const percentage = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

    this.onProgress?.({
      bytesUploaded: loaded,
      totalBytes: total,
      percentage,
      speedBytesPerSec: this.currentSpeed,
      etaSeconds,
    });
  }
}
