import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { PLANS } from '@blinkshare/shared';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

export const BillingDashboardPage: React.FC = () => {
  const { user, plan, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    api.getBillingStatus()
      .then((data) => setBillingStatus(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const planConfig = PLANS[plan];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Subscription & Plan
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Current Membership</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
            >
              Change / Upgrade Plan
            </Link>
          </div>
        </div>

        {/* Plan Details Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Active Plan</span>
            <span className="text-xl font-bold text-slate-900">{planConfig.name}</span>
            <p className="text-xs text-slate-500 mt-0.5">
              {planConfig.priceMonthlyInr === 0 ? 'Free tier' : `₹${planConfig.priceMonthlyInr}/month`}
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Billing Status</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{billingStatus?.subscription?.status || 'Active'}</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Configured Provider</span>
            <span className="text-sm font-mono font-semibold text-slate-700 uppercase">
              {billingStatus?.provider || 'None'}
            </span>
          </div>
        </div>

        {/* Provider Warning / Notice */}
        {!billingStatus?.isConfigured && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3 mt-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Payment Gateway Notice</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                Billing provider is currently set to <code>{billingStatus?.provider || 'none'}</code> without live credentials. To activate live Stripe or Razorpay subscription payments, configure your environment secrets in <code>wrangler.toml</code> or <code>.dev.vars</code>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Limits Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Your Entitlements</h3>
        <ul className="space-y-3 text-xs text-slate-600">
          <li className="flex items-center justify-between py-2 border-b border-slate-100">
            <span>Daily share creation quota</span>
            <span className="font-bold text-slate-900">{planConfig.maxSharesPerDay} shares/day</span>
          </li>
          <li className="flex items-center justify-between py-2 border-b border-slate-100">
            <span>Maximum text snippet size</span>
            <span className="font-bold text-slate-900">{Math.round(planConfig.maxTextBytes / 1024)} KB</span>
          </li>
          <li className="flex items-center justify-between py-2 border-b border-slate-100">
            <span>Maximum image upload size</span>
            <span className="font-bold text-slate-900">{Math.round(planConfig.maxImageBytes / (1024 * 1024))} MB</span>
          </li>
          <li className="flex items-center justify-between py-2 border-b border-slate-100">
            <span>Share link duration</span>
            <span className="font-bold text-brand-700">Strictly 5 minutes (Fixed across all tiers)</span>
          </li>
          <li className="flex items-center justify-between py-2 border-b border-slate-100">
            <span>Password protection</span>
            <span className="font-bold text-slate-900">{planConfig.passwordProtection ? 'Enabled' : 'Disabled'}</span>
          </li>
          <li className="flex items-center justify-between py-2">
            <span>Burn after first view</span>
            <span className="font-bold text-slate-900">{planConfig.burnAfterFirstView ? 'Enabled' : 'Disabled'}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
