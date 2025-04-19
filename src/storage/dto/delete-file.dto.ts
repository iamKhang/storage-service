import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class DeleteMultipleFilesDto {
  @IsArray()
  @IsNotEmpty()
  urls: string[];
}
