import { BadRequestException } from '@nestjs/common';

/**
 * Upload restrictions: raster images and PDFs only.
 * SVG is deliberately excluded (it can carry script).
 * Size limit via env UPLOAD_MAX_FILE_SIZE_MB (default 10).
 */
const ALLOWED: Record<string, { extensions: string[]; magic: (b: Buffer) => boolean }> = {
  'image/jpeg': {
    extensions: ['jpg', 'jpeg'],
    magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    extensions: ['png'],
    magic: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/gif': {
    extensions: ['gif'],
    magic: (b) => b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')),
  },
  'image/webp': {
    extensions: ['webp'],
    magic: (b) => b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  'application/pdf': {
    extensions: ['pdf'],
    magic: (b) => b.length >= 5 && b.subarray(0, 5).toString('ascii') === '%PDF-',
  },
};

export function uploadMaxFileSizeBytes(): number {
  const mb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 10) * 1024 * 1024;
}

/** Multer fileFilter: cheap early rejection on the declared MIME type. */
export function uploadFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED[file.mimetype]) {
    cb(new BadRequestException('Only JPEG, PNG, GIF, WEBP images and PDF files are allowed'), false);
    return;
  }
  cb(null, true);
}

/** Full check after upload: declared type, extension and file signature must all agree. */
export function assertAllowedUpload(file: Express.Multer.File): void {
  const rule = ALLOWED[file.mimetype];
  const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
  if (!rule || !rule.extensions.includes(ext)) {
    throw new BadRequestException('File extension does not match an allowed type');
  }
  if (!file.buffer || !rule.magic(file.buffer)) {
    throw new BadRequestException('File content does not match its declared type');
  }
  if (file.size > uploadMaxFileSizeBytes()) {
    throw new BadRequestException('File is too large');
  }
}
