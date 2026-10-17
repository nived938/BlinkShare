import { Hono } from 'hono';
import { FREE_TIER_LIMITS, PLANS } from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';

export const billingRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/billing - Returns 100% Free Tier confirmation & limits
billingRouter.get('/', (c) => {
  return c.json({
    isFreeTier: true,
    cost: '₹0 / $0 Forever',
    billingRequired: false,
    message: 'BlinkShare is completely free. No credit card or paid subscriptions required.',
    freeTierLimits: FREE_TIER_LIMITS,
    plans: PLANS,
  });
});

// POST /api/billing/checkout - Informs that everything is already free
billingRouter.post('/checkout', (c) => {
  return c.json({
    message: 'BlinkShare is 100% free! All features are unlocked for all users at ₹0 cost. No checkout or payment is required.',
    isFreeTier: true,
  });
});
