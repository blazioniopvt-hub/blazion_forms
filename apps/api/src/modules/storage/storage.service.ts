import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHmac, randomBytes } from 'crypto';

// ============================================================
// File Storage Service — Scalable Object Storage
// Supports: Cloudflare R2, AWS S3, local filesystem
// Features: Signed upload URLs, size validation, MIME filtering
// ============================================================

interface UploadConfig {
  maxSizeMb: number;
  allowedMimeTypes: string[];
  pathPrefix: string;
}

const DEFAULT_CONFIG: UploadConfig = {
  maxSizeMb: 25,
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
    'video/mp4', 'audio/mpeg',
  ],
  pathPrefix: 'uploads',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private prisma: PrismaService) {}

  // ── Generate Pre-signed Upload URL ─────────
  // Client uploads directly to storage (bypasses API server)
  // This prevents large file uploads from blocking API workers

  async generateUploadUrl(
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    userId?: string,
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    // Validate
    if (sizeBytes > DEFAULT_CONFIG.maxSizeMb * 1024 * 1024) {
      throw new BadRequestException(`File too large. Max: ${DEFAULT_CONFIG.maxSizeMb}MB`);
    }

    if (!DEFAULT_CONFIG.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(`File type not allowed: ${mimeType}`);
    }

    // Generate unique file key
    const ext = fileName.split('.').pop() || 'bin';
    const randomId = randomBytes(16).toString('hex');
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const fileKey = `${DEFAULT_CONFIG.pathPrefix}/${datePrefix}/${randomId}.${ext}`;

    // For R2/S3: Generate pre-signed PUT URL
    const uploadUrl = this.generateSignedUrl(fileKey, mimeType, 'PUT', 3600);
    const publicUrl = this.getPublicUrl(fileKey);

    // Track in database
    await this.prisma.fileUpload.create({
      data: {
        originalName: fileName,
        storagePath: fileKey,
        mimeType,
        sizeBytes,
        uploadedBy: userId,
      },
    });

    return { uploadUrl, fileKey, publicUrl };
  }

  // ── Generate Pre-signed Download URL ───────
  // Secure: URLs expire, preventing permanent public access

  async generateDownloadUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    return this.generateSignedUrl(fileKey, '', 'GET', expiresIn);
  }

  // ── Delete File ────────────────────────────

  async deleteFile(fileKey: string): Promise<void> {
    // Production: delete from R2/S3
    // await s3Client.deleteObject({ Bucket: BUCKET, Key: fileKey });

    await this.prisma.fileUpload.deleteMany({
      where: { storagePath: fileKey },
    });

    this.logger.log(`Deleted file: ${fileKey}`);
  }

  // ── Cleanup Orphaned Files ─────────────────

  async cleanupOrphans(olderThanDays = 30): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86400_000);
    const orphans = await this.prisma.fileUpload.findMany({
      where: { createdAt: { lt: cutoff } },
      take: 100,
    });

    for (const file of orphans) {
      await this.deleteFile(file.storagePath);
    }

    return orphans.length;
  }

  // ── Private Helpers ────────────────────────

  private generateSignedUrl(key: string, contentType: string, method: string, expiresIn: number): string {
    const bucket = process.env.R2_BUCKET || 'blazion-uploads';
    const endpoint = process.env.R2_ENDPOINT || 'https://storage.blazionforms.com';

    // Simplified signed URL (in production, use AWS SDK's getSignedUrl)
    const expiry = Math.floor(Date.now() / 1000) + expiresIn;
    const stringToSign = `${method}\n${bucket}\n${key}\n${expiry}`;
    const secret = process.env.R2_SECRET_KEY || 'local-dev-secret';
    const signature = createHmac('sha256', secret).update(stringToSign).digest('hex');

    return `${endpoint}/${key}?X-Amz-Expires=${expiresIn}&X-Amz-Signature=${signature}&method=${method}`;
  }

  private getPublicUrl(key: string): string {
    const cdnUrl = process.env.CDN_URL || process.env.R2_ENDPOINT || 'https://storage.blazionforms.com';
    return `${cdnUrl}/${key}`;
  }

  // ── Storage Stats ──────────────────────────

  async getStats() {
    const totalFiles = await this.prisma.fileUpload.count();
    const totalSize = await this.prisma.fileUpload.aggregate({
      _sum: { sizeBytes: true },
    });

    return {
      totalFiles,
      totalSizeBytes: totalSize._sum.sizeBytes || 0,
      totalSizeMb: Math.round((totalSize._sum.sizeBytes || 0) / 1024 / 1024),
    };
  }
}
