import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload-url')
  generateUploadUrl(
    @Req() req,
    @Body() body: { fileName: string; mimeType: string; sizeBytes: number },
  ) {
    return this.storageService.generateUploadUrl(
      body.fileName, body.mimeType, body.sizeBytes, req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('download-url/:fileKey(*)')
  generateDownloadUrl(@Param('fileKey') fileKey: string) {
    return this.storageService.generateDownloadUrl(fileKey);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':fileKey(*)')
  deleteFile(@Param('fileKey') fileKey: string) {
    return this.storageService.deleteFile(fileKey);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats() {
    return this.storageService.getStats();
  }
}
