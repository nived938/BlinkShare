import { Hono } from 'hono';
import { PlanType } from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';
import { BillingService } from '../services/billingService';

export const billingRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/billing - Current subscription status and configuration
billingRouter.get('/', async (c) => {
  const auth = c.get('auth');
  const billingService = new BillingService(c.env);
  const status = await billingService.getBillingStatus(auth.userId);
  return c.json(status);
});

// POST /api/billing/checkout - Initiate plan upgrade checkout
billingRouter.post('/checkout', async (c) => {
  const auth = c.get('auth');
  if (!auth.userId) {
    return c.json({ error: 'Please sign in or create an account to upgrade' }, 401);
  }

  const body = await c.req.json();
  const plan = body.plan as PlanType;
  if (!plan || (plan !== 'plus' && plan !== 'pro')) {
    return c.json({ error: 'Invalid plan selected' }, 400);
  }

  const billingService = new BillingService(c.env);
  try {
    const session = await billingService.createCheckoutSession(plan, auth.userId);
    return c.json(session);
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Checkout failed' }, status);
  }
});

// POST /api/billing/webhook/:provider - Webhook listener
billingRouter.post('/webhook/:provider', async (c) => {
  const provider = c.req.param('provider');
  const rawBody = await c.req.text();
  const billingService = new BillingService(c.env);

  try {
    const result = await billingService.handleWebhook(provider, rawBody, c.req.raw.headers);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || 'Webhook processing failed' }, 400);
  }
});
