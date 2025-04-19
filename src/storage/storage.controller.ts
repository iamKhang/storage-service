import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { BucketType, UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto, MultipleFilesResponseDto } from './dto/file-response.dto';

@Controller('storage')
export class StorageController {
  private maxFileSize: number;
  private maxFiles: number;

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024); // Default 10MB
    this.maxFiles = this.configService.get<number>('MAX_FILES', 10); // Default 10 files
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const bucket = uploadFileDto.bucket || BucketType.IMAGES;
    const folder = uploadFileDto.folder;

    const result = await this.storageService.uploadFile(file, {
      bucket,
      folder,
      contentType: file.mimetype,
    });

    return result;
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) files: Express.Multer.File[],
    @Body() uploadFileDto: UploadFileDto,
  ): Promise<MultipleFilesResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    const bucket = uploadFileDto.bucket || BucketType.IMAGES;
    const folder = uploadFileDto.folder;

    const results = await this.storageService.uploadMultipleFiles(files, {
      bucket,
      folder,
    });

    return {
      files: results,
      totalCount: results.length,
    };
  }

  @Get(':bucket/:key')
  async getFileInfo(
    @Param('bucket') bucket: string,
    @Param('key') key: string,
  ): Promise<FileResponseDto> {
    return this.storageService.getFileInfo(bucket, key);
  }

  @Delete(':bucket/:key')
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('key') key: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.storageService.deleteFile(bucket, key);
    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
