import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * Generates a unique file name with the original extension
 * @param originalName Original file name
 * @returns Unique file name with original extension
 */
export function generateUniqueFileName(originalName: string): string {
  const fileExt = path.extname(originalName);
  const fileName = `${uuidv4()}${fileExt}`;
  return fileName;
}

/**
 * Builds a file path with folder structure if provided
 * @param fileName File name
 * @param folder Optional folder path
 * @returns Complete file path
 */
export function buildFilePath(fileName: string, folder?: string): string {
  if (folder) {
    // Normalize folder path and remove leading/trailing slashes
    const normalizedFolder = folder
      .split('/')
      .filter(Boolean)
      .join('/');
    
    return normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
  }
  
  return fileName;
}
