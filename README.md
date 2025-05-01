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

- Node.js (v20 or higher) or Docker
- Supabase account with Storage enabled
- Supabase project with buckets created

## Setup

### Option 1: Running with Node.js

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
SUPABASE_SERVICE_KEY=your_supabase_anon_key
STORAGE_BUCKETS=avatars,courses,discussions
```

4. Start the application

```bash
$ npm run start:dev
```

### Option 2: Running with Docker

1. Clone the repository

```bash
$ git clone <repository-url>
$ cd storage-service
```

2. Configure environment variables

Create a `.env` file with your Supabase credentials:

```bash
$ cp .env.example .env
```

Update at least the following variables in the `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_anon_key
```

3. Build and start the Docker container

```bash
$ docker-compose up -d
```

The service will be available at http://localhost:3000/api/v1

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

### Delete a file by path

```
DELETE /api/v1/storage/delete/:bucket/:filepath
```

Parameters:
- `bucket`: The bucket where the file is stored
- `filepath`: The file path within the bucket

### Delete multiple files by paths

```
DELETE /api/v1/storage/delete-multiple/:bucket
```

Parameters:
- `bucket`: The bucket where the files are stored

Request body:
```json
{
  "paths": ["path/to/file1.jpg", "path/to/file2.pdf"]
}
```

### Delete a file by URL

```
POST /api/v1/storage/delete
```

Request body:
```json
{
  "url": "https://your-project.supabase.co/storage/v1/object/public/avatars/user123/profile.jpg"
}
```

### Delete multiple files by URLs

```
POST /api/v1/storage/delete-multiple
```

Request body:
```json
{
  "urls": [
    "https://your-project.supabase.co/storage/v1/object/public/avatars/user123/profile1.jpg",
    "https://your-project.supabase.co/storage/v1/object/public/avatars/user123/profile2.jpg"
  ]
}
```

## Supabase Storage Structure

The service is designed to work with multiple buckets in Supabase Storage. Each bucket can be used for different types of files:

- `avatars`: For user profile pictures
- `courses`: For course-related files and materials
- `discussions`: For files related to discussions and forums

Within each bucket, you can organize files in folders by specifying the `folder` parameter when uploading files.

## Docker Support

This project includes Docker support for easy deployment:

- `Dockerfile`: Multi-stage build for a production-ready container
- `docker-compose.yml`: Configuration for running the service with all required environment variables

### Building the Docker image manually

```bash
$ docker build -t storage-service .
```

### Running the Docker container manually

```bash
$ docker run -p 3000:3000 \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_SERVICE_KEY=your_supabase_anon_key \
  -e STORAGE_BUCKETS=avatars,courses,discussions \
  storage-service
```

## License

MIT
