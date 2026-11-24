import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../auth/caller.guard';
import {
  assertAllowedUpload,
  uploadFileFilter,
  uploadMaxFileSizeBytes,
} from './upload-file.validation';

@ApiTags('Upload')
@Authenticated()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload a file to S3 (JPEG/PNG/GIF/WEBP/PDF, max UPLOAD_MAX_FILE_SIZE_MB, default 10 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        fileUrl: {
          type: 'string',
          example: 'https://transbridge-dashboard.s3.eu-north-1.amazonaws.com/uploads/random-uuid.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - No file uploaded, disallowed file type, or upload failed',
  })
  @ApiResponse({ status: 413, description: 'File too large' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: uploadMaxFileSizeBytes(), files: 1 },
      fileFilter: uploadFileFilter,
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    assertAllowedUpload(file);

    try {
      const fileUrl = await this.uploadService.uploadFile(file);
      return {
        success: true,
        fileUrl,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
} 