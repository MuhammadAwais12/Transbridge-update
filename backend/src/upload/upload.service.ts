import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly REGION = 'eu-north-1';
  private readonly BUCKET_NAME = 'transbridge-dashboard';

  constructor() {
     const accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY || '';
    const secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_KEY || '';
    this.s3Client = new S3Client({
      region: this.REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    try {
      // Generate a random filename with original extension
      const fileExtension = file.originalname.split('.').pop();
      const randomFileName = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${randomFileName}`;

      const uploadParams = {
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Return the S3 URL of the uploaded file
      return `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async uploadBase64(base64String: string, folder: string = 'uploads'): Promise<string> {
    try {
      // Check if it's a data URL format (data:image/png;base64,...)
      const base64Regex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/;
      const matches = base64String.match(base64Regex);

      if (!matches) {
        throw new Error('Invalid base64 data URL format');
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Determine file extension from mime type
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
      };
      const fileExtension = mimeToExt[mimeType] || 'png';

      // Generate a random filename
      const randomFileName = `${uuidv4()}.${fileExtension}`;
      const key = `${folder}/${randomFileName}`;

      const uploadParams = {
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // Return the S3 URL of the uploaded file
      return `https://${this.BUCKET_NAME}.s3.${this.REGION}.amazonaws.com/${key}`;
    } catch (error) {
      throw new Error(`Failed to upload base64 to S3: ${error.message}`);
    }
  }
} 