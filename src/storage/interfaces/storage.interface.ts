export interface StorageFile {
  key: string;
  url: string;
  bucket: string;
  contentType: string;
  size: number;
  createdAt: Date;
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  contentType?: string;
}
