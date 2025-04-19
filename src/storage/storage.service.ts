import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from './interfaces/file-metadata.interface';
import { generateUniqueFileName, buildFilePath } from './utils/file.utils';

@Injectable()
export class StorageService {
  private supabase: any;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    console.log('SUPABASE_URL:', supabaseUrl);
    console.log('SUPABASE_SERVICE_KEY:', supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Key must be provided in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getFileType(mimeType: string): {
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
  } {
    const type = mimeType.split('/')[0];
    return {
      isImage: type === 'image',
      isVideo: type === 'video',
      isAudio: type === 'audio',
      isDocument:
        mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('sheet') ||
        mimeType.includes('presentation'),
    };
  }

  private async getImageMetadata(
    file: Express.Multer.File,
  ): Promise<{ width?: number; height?: number }> {
    if (!file.mimetype.startsWith('image/')) {
      return {};
    }

    try {
      // Here you could use sharp or another image processing library
      // For now, we'll return empty dimensions
      return {};
    } catch (error) {
      return {};
    }
  }

  private async buildFileMetadata(
    file: Express.Multer.File,
    uploadResult: any,
    bucketName: string,
    path: string,
  ): Promise<FileMetadata> {
    const fileExt = file.originalname.split('.').pop() || '';
    const fileTypes = this.getFileType(file.mimetype);
    const imageMetadata = await this.getImageMetadata(file);
    const fileName = path.split('/').pop() || 'unknown';

    return {
      id: uploadResult.path,
      originalName: file.originalname,
      fileName: fileName,
      mimeType: file.mimetype,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      path: uploadResult.path,
      url: this.supabase.storage.from(bucketName).getPublicUrl(path).data
        .publicUrl,
      bucketName: bucketName,
      uploadedAt: new Date(),
      lastModified: new Date(),
      contentType: file.mimetype,
      extension: fileExt,
      metadata: {
        ...fileTypes,
        ...imageMetadata,
        // Use mimetype instead of deprecated encoding
        mimetype: file.mimetype,
      },
    };
  }

  /**
   * Upload multiple files to Supabase Storage
   * @param files Array of files to upload
   * @param bucketName Name of the bucket to upload to
   * @param path Optional path within the bucket
   * @returns Array of uploaded file URLs and file data
   */
  async uploadFiles(
    files: Express.Multer.File[],
    bucketName: string,
    path: string = '',
  ): Promise<FileMetadata[]> {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const results: FileMetadata[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds maximum size of 10MB`,
        );
      }

      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const fullPath = path ? `${path}/${fileName}` : fileName;

      try {
        // Upload file to Supabase Storage
        const { data, error } = await this.supabase.storage
          .from(bucketName)
          .upload(fullPath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          throw new BadRequestException(
            `Error uploading file ${file.originalname}: ${error.message}`,
          );
        }

        const metadata = await this.buildFileMetadata(
          file,
          data,
          bucketName,
          fullPath,
        );
        results.push(metadata);
      } catch (error) {
        throw new BadRequestException(
          `Error uploading file ${file.originalname}: ${error.message}`,
        );
      }
    }

    return results;
  }

  /**
   * Update a file in Supabase Storage
   * @param file New file to upload
   * @param oldPath Path of the file to update
   * @param bucketName Name of the bucket
   * @returns Updated file URL and data
   */
  async updateFile(
    file: Express.Multer.File,
    oldPath: string,
    bucketName: string,
  ): Promise<FileMetadata> {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File ${file.originalname} exceeds maximum size of 10MB`,
      );
    }

    try {
      // Delete old file
      await this.deleteFile(oldPath, bucketName);

      // Upload new file with the same path
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(oldPath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        throw new BadRequestException(
          `Error updating file ${file.originalname}: ${error.message}`,
        );
      }

      return this.buildFileMetadata(file, data, bucketName, oldPath);
    } catch (error) {
      throw new BadRequestException(
        `Error updating file ${file.originalname}: ${error.message}`,
      );
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param path Path of the file to delete
   * @param bucketName Name of the bucket
   * @returns Success message
   */
  async deleteFile(path: string, bucketName: string) {
    try {
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        throw new BadRequestException(
          `Error deleting file at ${path}: ${error.message}`,
        );
      }

      return { message: `File at ${path} deleted successfully` };
    } catch (error) {
      throw new BadRequestException(
        `Error deleting file at ${path}: ${error.message}`,
      );
    }
  }

  /**
   * Delete multiple files from Supabase Storage
   * @param paths Array of file paths to delete
   * @param bucketName Name of the bucket
   * @returns Success message
   */
  async deleteFiles(paths: string[], bucketName: string) {
    try {
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove(paths);

      if (error) {
        throw new BadRequestException(`Error deleting files: ${error.message}`);
      }

      return { message: `${paths.length} files deleted successfully` };
    } catch (error) {
      throw new BadRequestException(`Error deleting files: ${error.message}`);
    }
  }

  /**
   * Get the public URL for a file in Supabase Storage
   * @param bucketName Name of the bucket
   * @param path Path of the file
   * @returns Public URL of the file
   */
  getPublicUrl(bucketName: string, path: string): string {
    const { data } = this.supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Extract bucket name and file path from a Supabase Storage URL
   * @param url Supabase Storage URL
   * @returns Object containing bucket name and file path
   */
  extractBucketAndPathFromUrl(url: string): { bucketName: string; filePath: string } {
    try {
      // Parse the URL
      const urlObj = new URL(url);

      // The path will be something like /storage/v1/object/public/bucketName/filePath
      const pathParts = urlObj.pathname.split('/');

      // Find the index of 'public' which comes before the bucket name
      const publicIndex = pathParts.findIndex(part => part === 'public');

      if (publicIndex === -1 || publicIndex + 1 >= pathParts.length) {
        throw new BadRequestException(`Invalid Supabase Storage URL: ${url}`);
      }

      const bucketName = pathParts[publicIndex + 1];

      // The file path is everything after the bucket name
      const filePath = pathParts.slice(publicIndex + 2).join('/');

      if (!bucketName || !filePath) {
        throw new BadRequestException(`Could not extract bucket name or file path from URL: ${url}`);
      }

      return { bucketName, filePath };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Invalid URL format: ${url}. Error: ${error.message}`);
    }
  }

  /**
   * Delete a file using its public URL
   * @param url Public URL of the file
   * @returns Success message
   */
  async deleteFileByUrl(url: string) {
    const { bucketName, filePath } = this.extractBucketAndPathFromUrl(url);
    return this.deleteFile(filePath, bucketName);
  }

  /**
   * Delete multiple files using their public URLs
   * @param urls Array of public URLs
   * @returns Success message
   */
  async deleteFilesByUrls(urls: string[]) {
    const fileDetails = urls.map(url => this.extractBucketAndPathFromUrl(url));

    // Group files by bucket to optimize deletion
    const bucketMap = new Map<string, string[]>();

    fileDetails.forEach(({ bucketName, filePath }) => {
      if (!bucketMap.has(bucketName)) {
        bucketMap.set(bucketName, []);
      }
      // Use non-null assertion operator since we just checked and set it if it didn't exist
      const paths = bucketMap.get(bucketName)!;
      paths.push(filePath);
    });

    // Delete files from each bucket
    const results: any[] = [];
    for (const [bucketName, paths] of bucketMap.entries()) {
      const result = await this.deleteFiles(paths, bucketName);
      results.push(result);
    }

    return {
      message: `${urls.length} files deleted successfully`,
      details: results
    };
  }
}
