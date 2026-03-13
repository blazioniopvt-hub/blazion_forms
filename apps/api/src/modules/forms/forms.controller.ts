import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto, UpdateFormDto, UpdateFormFieldsDto } from './dto/forms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateFormDto) {
    return this.formsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req, @Query('workspaceId') workspaceId: string) {
    return this.formsService.findAll(req.user.id, workspaceId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('templates')
  getTemplates() {
    return this.formsService.getTemplates();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.formsService.findOne(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.formsService.update(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/fields')
  updateFields(@Req() req, @Param('id') id: string, @Body() dto: UpdateFormFieldsDto) {
    return this.formsService.updateFields(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/duplicate')
  duplicate(@Req() req, @Param('id') id: string) {
    return this.formsService.duplicate(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.formsService.remove(req.user.id, id);
  }

  // PUBLIC endpoint — no auth required
  @Get('public/:slug')
  findPublicForm(@Param('slug') slug: string) {
    return this.formsService.findPublicBySlug(slug);
  }
}
