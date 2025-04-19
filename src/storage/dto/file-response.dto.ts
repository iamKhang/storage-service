export class FileResponseDto {
  key: string;
  url: string;
  bucket: string;
  contentType: string;
  size: number;
  createdAt: Date;
}

export class MultipleFilesResponseDto {
  files: FileResponseDto[];
  totalCount: number;
}
