import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Body,
  Param,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FileMetadata } from './interfaces/file-metadata.interface';
import { BucketType, UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { DeleteFileDto, DeleteMultipleFilesDto } from './dto/delete-file.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(ValidationPipe) uploadDto: UploadFileDto,
  ): Promise<FileMetadata> {
    const bucketName = uploadDto.bucket || BucketType.AVATARS;
    const path = uploadDto.folder || '';
    const result = await this.storageService.uploadFiles([file], bucketName, path);
    return result[0];
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body(ValidationPipe) uploadDto: UploadFileDto,
  ): Promise<FileMetadata[]> {
    const bucketName = uploadDto.bucket || BucketType.AVATARS;
    const path = uploadDto.folder || '';
    return this.storageService.uploadFiles(files, bucketName, path);
  }

  @Post('upload/:bucket')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFilesToBucket(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('bucket') bucketName: string,
    @Body('path') path?: string,
  ): Promise<FileMetadata[]> {
    return this.storageService.uploadFiles(files, bucketName, path);
  }

  @Get(':bucket/:key')
  async getFileInfo(
    @Param('bucket') bucketName: string,
    @Param('key') key: string,
  ): Promise<FileResponseDto> {
    // This is a placeholder for future implementation
    // Currently, Supabase doesn't provide a direct way to get file metadata
    // We would need to store metadata in a database to implement this properly
    return {
      key,
      url: this.storageService.getPublicUrl(bucketName, key),
      bucket: bucketName,
      contentType: 'application/octet-stream', // Placeholder
      size: 0, // Placeholder
      createdAt: new Date(),
    };
  }

  @Put('update/:bucket/*filepath')
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('bucket') bucketName: string,
    @Param('filepath') filePath: string,
  ): Promise<FileMetadata> {
    return this.storageService.updateFile(file, filePath, bucketName);
  }

  @Delete('delete/:bucket/*filepath')
  async deleteFile(
    @Param('bucket') bucketName: string,
    @Param('filepath') filePath: string,
  ) {
    return this.storageService.deleteFile(filePath, bucketName);
  }

  @Delete('delete-multiple/:bucket')
  async deleteFiles(
    @Param('bucket') bucketName: string,
    @Body('paths') paths: string[],
  ) {
    return this.storageService.deleteFiles(paths, bucketName);
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  async deleteFileByUrl(
    @Body(ValidationPipe) deleteDto: DeleteFileDto,
  ) {
    return this.storageService.deleteFileByUrl(deleteDto.url);
  }

  @Post('delete-multiple')
  @HttpCode(HttpStatus.OK)
  async deleteFilesByUrls(
    @Body(ValidationPipe) deleteDto: DeleteMultipleFilesDto,
  ) {
    return this.storageService.deleteFilesByUrls(deleteDto.urls);
  }
}
