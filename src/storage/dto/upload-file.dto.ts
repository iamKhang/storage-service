import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum BucketType {
  AVATARS = 'avatars',
  COURSES = 'courses',
  DISCUSSIONS = 'discussions',
}

export class UploadFileDto {
  @IsEnum(BucketType)
  @IsOptional()
  bucket?: BucketType = BucketType.AVATARS;

  @IsString()
  @IsOptional()
  folder?: string;
}
