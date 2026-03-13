import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================
// Billing Service — Stripe Subscription Management
// ============================================================

const PLANS = {
  free: { name: 'Free', price: 0, forms: 3, responses: 100, members: 1, storage: '100MB', ai: 5 },
  pro: { name: 'Pro', price: 19, forms: 50, responses: 10000, members: 5, storage: '5GB', ai: 100 },
  business: { name: 'Business', price: 49, forms: -1, responses: -1, members: -1, storage: '50GB', ai: -1 },
};

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  getPlans() {
    return Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
      formsLabel: plan.forms === -1 ? 'Unlimited' : `${plan.forms} forms`,
      responsesLabel: plan.responses === -1 ? 'Unlimited' : `${plan.responses.toLocaleString()}/mo`,
      membersLabel: plan.members === -1 ? 'Unlimited' : `${plan.members} members`,
      aiLabel: plan.ai === -1 ? 'Unlimited' : `${plan.ai}/mo`,
    }));
  }

  async getSubscription(workspaceId: string) {
    let sub = await this.prisma.subscription.findUnique({ where: { workspaceId } });
    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: { workspaceId, plan: 'free', status: 'active' },
      });
    }
    const planDetails = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;
    return { ...sub, planDetails };
  }

  async createCheckoutSession(workspaceId: string, plan: string) {
    if (!PLANS[plan as keyof typeof PLANS]) throw new BadRequestException('Invalid plan');
    if (plan === 'free') throw new BadRequestException('Cannot create checkout for free plan');

    // Production: Create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({ ... })
    // Return session.url for redirect

    return {
      checkoutUrl: `https://checkout.stripe.com/demo?plan=${plan}&workspace=${workspaceId}`,
      message: 'Redirect user to Stripe Checkout (configure STRIPE_SECRET_KEY in .env)',
    };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.activateSubscription(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.updateSubscription(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  async checkUsage(workspaceId: string) {
    const sub = await this.getSubscription(workspaceId);
    const plan = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;

    const formCount = await this.prisma.form.count({ where: { workspaceId } });
    const memberCount = await this.prisma.workspaceMember.count({ where: { workspaceId } });
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const responseCount = await this.prisma.response.count({
      where: { form: { workspaceId }, submittedAt: { gte: monthStart } },
    });

    return {
      plan: sub.plan,
      usage: {
        forms: { used: formCount, limit: plan.forms, exceeded: plan.forms !== -1 && formCount >= plan.forms },
        responses: { used: responseCount, limit: plan.responses, exceeded: plan.responses !== -1 && responseCount >= plan.responses },
        members: { used: memberCount, limit: plan.members, exceeded: plan.members !== -1 && memberCount >= plan.members },
      },
    };
  }

  private async activateSubscription(session: any) {
    const workspaceId = session.metadata?.workspaceId;
    if (!workspaceId) return;
    await this.prisma.subscription.upsert({
      where: { workspaceId },
      update: {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        plan: session.metadata?.plan || 'pro',
        status: 'active',
      },
      create: {
        workspaceId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        plan: session.metadata?.plan || 'pro',
        status: 'active',
      },
    });
    await this.prisma.workspace.update({ where: { id: workspaceId }, data: { plan: session.metadata?.plan || 'pro' } });
  }

  private async updateSubscription(subscription: any) { /* Stripe webhook handler */ }
  private async cancelSubscription(subscription: any) { /* Stripe webhook handler */ }
  private async handlePaymentFailed(invoice: any) { /* Stripe webhook handler */ }
}
