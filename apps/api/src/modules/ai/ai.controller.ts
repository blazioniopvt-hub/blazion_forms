import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class GenerateFormDto {
  @IsString()
  prompt: string;

  @IsString()
  workspaceId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-form')
  generateForm(@Req() req, @Body() dto: GenerateFormDto) {
    return this.aiService.generateForm(req.user.id, dto.prompt, dto.workspaceId);
  }

  @Get('insights/:formId')
  getInsights(@Param('formId') formId: string) {
    return this.aiService.getSmartInsights(formId);
  }

  @Get('suggestions/:formId')
  getSuggestions(@Param('formId') formId: string) {
    return this.aiService.suggestFieldImprovements(formId);
  }
}
