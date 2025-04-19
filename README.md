# Storage Service with Supabase

A NestJS service for storing and managing files (images, videos, documents, etc.) using Supabase Storage.

## Description

This service provides a set of RESTful API endpoints for uploading, retrieving, and managing files in Supabase Storage. It supports multiple buckets for different file types and provides a clean, organized structure for file storage.

## Features

- Upload single files to Supabase Storage
- Upload multiple files at once
- Organize files in different buckets (avatars, documents, videos, images)
- Support for folder structure within buckets
- Automatic generation of unique file names
- File validation (size, type)
- Retrieve file information
- Delete files

## Prerequisites

- Node.js (v16 or higher)
- Supabase account with Storage enabled
- Supabase project with buckets created

## Setup

1. Clone the repository

```bash
$ git clone <repository-url>
$ cd storage-service
```

2. Install dependencies

```bash
$ npm install
```

3. Configure environment variables

Copy the `.env.example` file to `.env` and update the values:

```bash
$ cp .env.example .env
```

Update the following variables in the `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
STORAGE_BUCKETS=avatars,documents,videos,images
```

4. Start the application

```bash
$ npm run start:dev
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Upload a single file

```
POST /api/v1/storage/upload
```

Form data:
- `file`: The file to upload
- `bucket` (optional): The bucket to store the file in (default: 'avatars')
- `folder` (optional): The folder path within the bucket

### Upload multiple files

```
POST /api/v1/storage/upload-multiple
```

Form data:
- `files`: The files to upload (array)
- `bucket` (optional): The bucket to store the files in (default: 'avatars')
- `folder` (optional): The folder path within the bucket

### Get file information

```
GET /api/v1/storage/:bucket/:key
```

Parameters:
- `bucket`: The bucket where the file is stored
- `key`: The file key/path

### Delete a file

```
DELETE /api/v1/storage/:bucket/:key
```

Parameters:
- `bucket`: The bucket where the file is stored
- `key`: The file key/path

## Supabase Storage Structure

The service is designed to work with multiple buckets in Supabase Storage. Each bucket can be used for different types of files:

- `avatars`: For user profile pictures
- `courses`: For course-related files and materials
- `discussions`: For files related to discussions and forums

Within each bucket, you can organize files in folders by specifying the `folder` parameter when uploading files.

## License

MIT
