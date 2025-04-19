import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * Generate a unique filename using UUID
 * @param originalName Original filename
 * @returns Unique filename with original extension
 */
export function generateUniqueFileName(originalName: string): string {
  const fileExt = path.extname(originalName);
  const fileName = `${uuidv4()}${fileExt}`;
  return fileName;
}

/**
 * Build a file path by combining folder and filename
 * @param fileName Filename
 * @param folder Optional folder path
 * @returns Combined path
 */
export function buildFilePath(fileName: string, folder?: string): string {
  if (folder) {
    // Normalize folder path by removing empty segments
    const normalizedFolder = folder
      .split('/')
      .filter(Boolean)
      .join('/');

    return normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
  }

  return fileName;
}
