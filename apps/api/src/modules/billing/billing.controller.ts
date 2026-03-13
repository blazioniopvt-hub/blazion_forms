import { Controller, Get, Post, Body, Param, UseGuards, Req, RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/:workspaceId')
  getSubscription(@Param('workspaceId') workspaceId: string) {
    return this.billingService.getSubscription(workspaceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(@Body() body: { workspaceId: string; plan: string }) {
    return this.billingService.createCheckoutSession(body.workspaceId, body.plan);
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage/:workspaceId')
  checkUsage(@Param('workspaceId') workspaceId: string) {
    return this.billingService.checkUsage(workspaceId);
  }

  @Post('webhook')
  handleWebhook(@Req() req: any) {
    return this.billingService.handleWebhook(req.body);
  }
}
