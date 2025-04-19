import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum BucketType {
  AVATARS = 'avatars',
  DOCUMENTS = 'documents',
  VIDEOS = 'videos',
  IMAGES = 'images',
}

export class UploadFileDto {
  @IsEnum(BucketType)
  @IsOptional()
  bucket?: BucketType = BucketType.IMAGES;

  @IsString()
  @IsOptional()
  folder?: string;
}
