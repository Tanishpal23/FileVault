import { ObjectMetadata, CompletedPart } from "../types/storage";

export interface StorageProvider {
  /**
   * Upload a complete object
   */
  upload(key: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void>;

  /**
   * Delete an object from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Copy an existing object to a new storage key
   */
  copyObject(sourceKey: string, targetKey: string): Promise<void>;

  /**
   * Generate a short-lived presigned URL for direct browser PUT upload
   */
  getSignedUploadUrl(key: string, expiresInSeconds?: number, contentType?: string): Promise<string>;

  /**
   * Generate a short-lived presigned URL for secure download
   */
  getSignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
    filename?: string,
    disposition?: "inline" | "attachment"
  ): Promise<string>;

  /**
   * Initiate S3/R2 multipart upload
   */
  initiateMultipartUpload(key: string, contentType?: string): Promise<string>;

  /**
   * Generate a presigned URL for a single multipart chunk
   */
  getSignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresInSeconds?: number
  ): Promise<string>;

  /**
   * Complete multipart upload with all uploaded parts
   */
  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ): Promise<{ location?: string; etag?: string }>;

  /**
   * Abort multipart upload and cleanup uploaded chunks
   */
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;

  /**
   * Get object metadata (size, etag, contentType)
   */
  getObjectMetadata(key: string): Promise<ObjectMetadata>;

  /**
   * Check if object exists
   */
  objectExists(key: string): Promise<boolean>;

  /**
   * Get object stream or buffer for reading
   */
  getObject(key: string): Promise<any>;
}
