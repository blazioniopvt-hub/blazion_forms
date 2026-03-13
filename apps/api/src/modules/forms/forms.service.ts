import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormDto, UpdateFormDto, UpdateFormFieldsDto } from './dto/forms.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  // Create a new form
  async create(userId: string, dto: CreateFormDto) {
    await this.checkWorkspaceAccess(userId, dto.workspaceId);

    const slug = `${dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${uuidv4().slice(0, 8)}`;

    return this.prisma.form.create({
      data: {
        workspaceId: dto.workspaceId,
        title: dto.title,
        slug,
        description: dto.description,
      },
      include: { fields: true },
    });
  }

  // Get all forms for a workspace
  async findAll(userId: string, workspaceId: string) {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const forms = await this.prisma.form.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { responses: true } } },
    });

    return forms.map((f) => ({
      ...f,
      responseCount: f._count.responses,
      _count: undefined,
    }));
  }

  // Get a single form by ID (for builder)
  async findOne(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: { orderBy: [{ pageNumber: 'asc' }, { orderIndex: 'asc' }] },
        webhooks: true,
        _count: { select: { responses: true } },
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    await this.checkWorkspaceAccess(userId, form.workspaceId);
    return { ...form, responseCount: form._count.responses };
  }

  // Get public form (for filling out)
  async findPublicBySlug(slug: string) {
    const form = await this.prisma.form.findUnique({
      where: { slug },
      include: {
        fields: { orderBy: [{ pageNumber: 'asc' }, { orderIndex: 'asc' }] },
      },
    });
    if (!form || form.status !== 'published') throw new NotFoundException('Form not found');

    // Track analytics view
    await this.trackView(form.id);

    return form;
  }

  // Update form metadata
  async update(userId: string, formId: string, dto: UpdateFormDto) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) throw new NotFoundException();
    await this.checkWorkspaceAccess(userId, form.workspaceId);

    const data: any = { ...dto };
    if (dto.status === 'published' && form.status !== 'published') {
      data.publishedAt = new Date();
    }

    return this.prisma.form.update({ where: { id: formId }, data });
  }

  // Bulk update fields (replaces all fields in a transaction)
  async updateFields(userId: string, formId: string, dto: UpdateFormFieldsDto) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) throw new NotFoundException();
    await this.checkWorkspaceAccess(userId, form.workspaceId);

    return this.prisma.$transaction(async (tx) => {
      // Remove all existing fields
      await tx.formField.deleteMany({ where: { formId } });

      // Create new fields
      await tx.formField.createMany({
        data: dto.fields.map((f) => ({
          formId,
          type: f.type,
          label: f.label,
          description: f.description,
          placeholder: f.placeholder,
          required: f.required,
          orderIndex: f.orderIndex,
          pageNumber: f.pageNumber,
          properties: f.properties || {},
          validation: f.validation || {},
          conditional: f.conditional || {},
        })),
      });

      return tx.form.findUnique({
        where: { id: formId },
        include: { fields: { orderBy: [{ pageNumber: 'asc' }, { orderIndex: 'asc' }] } },
      });
    });
  }

  // Duplicate a form
  async duplicate(userId: string, formId: string) {
    const original = await this.findOne(userId, formId);
    const slug = `${original.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${uuidv4().slice(0, 8)}`;

    const newForm = await this.prisma.form.create({
      data: {
        workspaceId: original.workspaceId,
        title: `${original.title} (Copy)`,
        slug,
        description: original.description,
        totalPages: original.totalPages,
        themeSettings: original.themeSettings as any,
        settings: original.settings as any,
        conditionalLogic: original.conditionalLogic as any,
        customCss: original.customCss,
        thankYouMessage: original.thankYouMessage,
      },
    });

    // Copy fields
    if (original.fields.length > 0) {
      await this.prisma.formField.createMany({
        data: original.fields.map((f) => ({
          formId: newForm.id,
          type: f.type,
          label: f.label,
          description: f.description,
          placeholder: f.placeholder,
          required: f.required,
          orderIndex: f.orderIndex,
          pageNumber: f.pageNumber,
          properties: f.properties as any,
          validation: f.validation as any,
          conditional: f.conditional as any,
        })),
      });
    }

    return this.prisma.form.findUnique({
      where: { id: newForm.id },
      include: { fields: true },
    });
  }

  // Delete a form
  async remove(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) throw new NotFoundException();
    await this.checkWorkspaceAccess(userId, form.workspaceId);
    await this.prisma.form.delete({ where: { id: formId } });
    return { deleted: true };
  }

  // Get form templates
  async getTemplates() {
    return this.prisma.form.findMany({
      where: { isTemplate: true },
      include: { fields: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Track view
  private async trackView(formId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.prisma.formAnalytics.upsert({
      where: { formId_date: { formId, date: today } },
      update: { views: { increment: 1 } },
      create: { formId, date: today, views: 1 },
    });
  }

  private async checkWorkspaceAccess(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('No access to this workspace');
  }
}
