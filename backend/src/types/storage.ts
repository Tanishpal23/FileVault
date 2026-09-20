export interface ObjectMetadata {
  contentType?: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
}

export interface CompletedPart {
  partNumber: number;
  etag: string;
}

export interface MultipartUploadSession {
  uploadId: string;
  key: string;
}
