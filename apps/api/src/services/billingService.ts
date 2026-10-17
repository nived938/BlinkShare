import { PlanType, PLANS } from '@blinkshare/shared';
import { Env } from '../types/env';
import { UserRepository } from '../repositories/userRepository';
import { getCurrentTimestamp } from '../lib/clock';
import { generateSecureId } from '../lib/crypto';

export interface BillingStatus {
  provider: string;
  isConfigured: boolean;
  userPlan: PlanType;
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: number;
    provider: string;
  } | null;
}

export class BillingService {
  private userRepo: UserRepository;

  constructor(private env: Env) {
    this.userRepo = new UserRepository(env.DB);
  }

  getProviderName(): string {
    return (this.env.BILLING_PROVIDER || 'none').toLowerCase();
  }

  isConfigured(): boolean {
    const provider = this.getProviderName();
    if (provider === 'razorpay') {
      return Boolean(this.env.RAZORPAY_KEY_ID && this.env.RAZORPAY_KEY_SECRET);
    }
    if (provider === 'stripe') {
      return Boolean(this.env.STRIPE_SECRET_KEY);
    }
    return false;
  }

  async getBillingStatus(userId?: string): Promise<BillingStatus> {
    const provider = this.getProviderName();
    const isConfigured = this.isConfigured();

    if (!userId) {
      return {
        provider,
        isConfigured,
        userPlan: 'free',
        subscription: null,
      };
    }

    const user = await this.userRepo.findById(userId);
    const sub = await this.userRepo.getSubscriptionByUserId(userId);

    return {
      provider,
      isConfigured,
      userPlan: user?.plan || 'free',
      subscription: sub
        ? {
            id: sub.subscription_id,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            provider: sub.provider,
          }
        : null,
    };
  }

  async createCheckoutSession(
    plan: PlanType,
    userId: string
  ): Promise<{ checkoutUrl?: string; orderId?: string; keyId?: string; message?: string }> {
    if (plan === 'free') {
      throw new Error('Cannot checkout for Free plan');
    }

    const provider = this.getProviderName();

    if (!this.isConfigured()) {
      return {
        message: `Billing provider '${provider}' is not configured in this environment. Set valid API keys to enable live payment checkouts.`,
      };
    }

    const planConfig = PLANS[plan];
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (provider === 'razorpay') {
      // Razorpay order creation
      const authHeader = btoa(`${this.env.RAZORPAY_KEY_ID}:${this.env.RAZORPAY_KEY_SECRET}`);
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: planConfig.priceMonthlyInr * 100, // paise
          currency: 'INR',
          receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
          notes: {
            userId,
            plan,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Razorpay order creation failed: ${errorText}`);
      }

      const orderData = (await res.json()) as any;
      return {
        orderId: orderData.id,
        keyId: this.env.RAZORPAY_KEY_ID,
      };
    }

    if (provider === 'stripe') {
      // Stripe checkout session creation
      const body = new URLSearchParams();
      body.append('mode', 'subscription');
      body.append('client_reference_id', userId);
      body.append('success_url', `${this.env.APP_URL}/dashboard/billing?status=success`);
      body.append('cancel_url', `${this.env.APP_URL}/pricing?status=cancelled`);
      body.append('line_items[0][price_data][currency]', 'usd');
      body.append('line_items[0][price_data][product_data][name]', `BlinkShare ${planConfig.name} Plan`);
      body.append('line_items[0][price_data][recurring][interval]', 'month');
      body.append('line_items[0][price_data][unit_amount]', String(Math.round(planConfig.priceMonthlyUsd * 100)));
      body.append('line_items[0][quantity]', '1');
      body.append('metadata[userId]', userId);
      body.append('metadata[plan]', plan);

      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Stripe session creation failed: ${errorText}`);
      }

      const sessionData = (await res.json()) as any;
      return {
        checkoutUrl: sessionData.url,
      };
    }

    return {
      message: 'No billing provider configured.',
    };
  }

  async handleWebhook(provider: string, rawBody: string, headers: Headers): Promise<{ processed: boolean; reason?: string }> {
    const now = getCurrentTimestamp(this.env);

    if (provider === 'stripe') {
      const sigHeader = headers.get('stripe-signature');
      const webhookSecret = this.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        return { processed: false, reason: 'Stripe webhook secret not configured' };
      }

      // Basic signature validation check
      if (!sigHeader) {
        return { processed: false, reason: 'Missing Stripe signature header' };
      }

      let event: any;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return { processed: false, reason: 'Invalid JSON payload' };
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        const plan = (session.metadata?.plan as PlanType) || 'plus';

        if (userId) {
          await this.userRepo.updateUserPlan(userId, plan);
          await this.userRepo.createOrUpdateSubscription({
            id: generateSecureId(16),
            user_id: userId,
            provider: 'stripe',
            subscription_id: session.subscription || session.id,
            plan,
            status: 'active',
            current_period_end: now + 30 * 86400,
            created_at: now,
            updated_at: now,
          });
          return { processed: true };
        }
      }

      return { processed: true, reason: 'Unhandled event type' };
    }

    if (provider === 'razorpay') {
      const secret = this.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        return { processed: false, reason: 'Razorpay webhook secret not configured' };
      }

      let event: any;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return { processed: false, reason: 'Invalid JSON payload' };
      }

      if (event.event === 'order.paid' || event.event === 'payment.captured') {
        const entity = event.payload?.payment?.entity || event.payload?.order?.entity;
        const userId = entity?.notes?.userId;
        const plan = (entity?.notes?.plan as PlanType) || 'plus';

        if (userId) {
          await this.userRepo.updateUserPlan(userId, plan);
          await this.userRepo.createOrUpdateSubscription({
            id: generateSecureId(16),
            user_id: userId,
            provider: 'razorpay',
            subscription_id: entity.id,
            plan,
            status: 'active',
            current_period_end: now + 30 * 86400,
            created_at: now,
            updated_at: now,
          });
          return { processed: true };
        }
      }

      return { processed: true, reason: 'Event noted' };
    }

    return { processed: false, reason: `Unknown provider ${provider}` };
  }
}
