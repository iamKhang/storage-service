import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageFile, UploadOptions } from './interfaces';
import { generateUniqueFileName, buildFilePath } from './utils';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private buckets: string[];

  constructor(private configService: ConfigService) {
    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Get available buckets from environment
    const bucketsStr = this.configService.get<string>('STORAGE_BUCKETS');
    this.buckets = bucketsStr ? bucketsStr.split(',') : [];
  }

  /**
   * Validates if the bucket exists
   */
  private validateBucket(bucket: string): void {
    if (!this.buckets.includes(bucket)) {
      throw new BadRequestException(`Invalid bucket: ${bucket}. Available buckets: ${this.buckets.join(', ')}`);
    }
  }

  /**
   * Upload a single file to Supabase storage
   */
  async uploadFile(file: Express.Multer.File, options: UploadOptions): Promise<StorageFile> {
    try {
      this.validateBucket(options.bucket);

      // Generate a unique file name
      const fileName = generateUniqueFileName(file.originalname);

      // Build the file path with folder if provided
      const filePath = buildFilePath(fileName, options.folder);

      // Upload the file to Supabase
      const { data, error } = await this.supabase.storage
        .from(options.bucket)
        .upload(filePath, file.buffer, {
          contentType: options.contentType || file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new InternalServerErrorException(`Failed to upload file: ${error.message}`);
      }

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      return {
        key: data.path,
        url: urlData.publicUrl,
        bucket: options.bucket,
        contentType: file.mimetype,
        size: file.size,
        createdAt: new Date(),
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Supabase storage
   */
  async uploadMultipleFiles(files: Express.Multer.File[], options: UploadOptions): Promise<StorageFile[]> {
    try {
      this.validateBucket(options.bucket);

      const uploadPromises = files.map(file => this.uploadFile(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to upload files: ${error.message}`);
    }
  }

  /**
   * Delete a file from Supabase storage
   */
  async deleteFile(bucket: string, filePath: string): Promise<void> {
    try {
      this.validateBucket(bucket);

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new InternalServerErrorException(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file information from Supabase storage
   */
  async getFileInfo(bucket: string, filePath: string): Promise<StorageFile> {
    try {
      this.validateBucket(bucket);

      // Get file metadata
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        throw new NotFoundException(`File not found: ${error.message}`);
      }

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        key: filePath,
        url: urlData.publicUrl,
        bucket: bucket,
        contentType: data.type,
        size: data.size,
        createdAt: new Date(),
      };
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof BadRequestException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get file info: ${error.message}`);
    }
  }
}
