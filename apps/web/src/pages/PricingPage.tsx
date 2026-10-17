import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { PlanType } from '@blinkshare/shared';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

export const PricingPage: React.FC = () => {
  const { user, plan: currentPlan } = useAuth();
  const navigate = useNavigate();

  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [billingInfo, setBillingInfo] = useState<{ provider: string; isConfigured: boolean } | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getBillingStatus()
      .then((res) => setBillingInfo(res))
      .catch(() => {});
  }, []);

  const handleSelectPlan = async (targetPlan: PlanType) => {
    if (targetPlan === 'free') {
      navigate('/');
      return;
    }

    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    setLoadingCheckout(targetPlan);
    setCheckoutMessage(null);

    try {
      const res = await api.createCheckout(targetPlan);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else if (res.message) {
        setCheckoutMessage(res.message);
      }
    } catch (err: any) {
      setCheckoutMessage(err.message || 'Checkout failed');
    } finally {
      setLoadingCheckout(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Simple, Honest Ephemeral Pricing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Pick your sharing power.{' '}
          <span className="bg-gradient-to-r from-brand-600 to-electric-cyan bg-clip-text text-transparent">
            Same 5-minute guarantee.
          </span>
        </h1>

        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Upgrade for higher file size limits, password locks, and burn-after-view. All shares—regardless of tier—expire after exactly 300 seconds.
        </p>

        {/* Invariant Expiry Notice */}
        <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Mandatory lifetime policy:</strong> No paid plan extends links past 5 minutes. Content is wiped automatically for everyone.
          </span>
        </div>

        {/* Currency Switcher */}
        <div className="pt-4 flex items-center justify-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Currency:</span>
          <div className="bg-slate-100 p-1 rounded-xl inline-flex border border-slate-200">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currency === 'INR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currency === 'USD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>
      </div>

      {billingInfo && !billingInfo.isConfigured && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <span>Payment checkout is in demonstration mode (Provider: {billingInfo.provider}). Live payment credentials can be configured in Worker environment settings.</span>
        </div>
      )}

      {checkoutMessage && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Billing Notice</p>
            <p className="mt-0.5">{checkoutMessage}</p>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        {/* FREE PLAN */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Free</h3>
              {currentPlan === 'free' && (
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6 min-h-[32px]">
              Fast anonymous sharing without registration. Perfect for everyday links.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">
                {currency === 'INR' ? '₹0' : '$0'}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100 KB text & code limit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>5 MB maximum image size</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>10 shares per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="font-semibold text-brand-700">Strict 5-minute expiration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Local QR code & syntax highlighting</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>Password protection</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>Burn after first view</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('free')}
            className="w-full py-2.5 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Start Free (No Sign-in)
          </button>
        </div>

        {/* PLUS PLAN */}
        <div className="bg-white rounded-3xl border-2 border-brand-500 p-8 shadow-xl shadow-brand-500/10 relative flex flex-col justify-between">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Plus</h3>
              {currentPlan === 'plus' && (
                <span className="text-[11px] font-bold uppercase tracking-wider bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full border border-brand-200">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6 min-h-[32px]">
              Enhanced security with password locks and burn-after-view privacy.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">
                {currency === 'INR' ? '₹99' : '$1.49'}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">500 KB text size</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">25 MB image uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100 shares per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="font-semibold text-brand-700">Strict 5-minute expiration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Password protection</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Burn after first view</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Download restriction toggle</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('plus')}
            disabled={loadingCheckout === 'plus' || currentPlan === 'plus'}
            className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
          >
            {loadingCheckout === 'plus' ? 'Processing...' : currentPlan === 'plus' ? 'Current Plan' : 'Upgrade to Plus'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Pro</h3>
              {currentPlan === 'pro' && (
                <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-6 min-h-[32px]">
              High capacity for developers, teams, and high-frequency workflows.
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">
                {currency === 'INR' ? '₹249' : '$3.49'}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">/ month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">1 MB text snippets</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">50 MB high-res images</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>500 shares per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span className="font-semibold text-brand-700">Strict 5-minute expiration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Password protection & Burn on view</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Custom share aliases</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Detailed share analytics</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectPlan('pro')}
            disabled={loadingCheckout === 'pro' || currentPlan === 'pro'}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50"
          >
            {loadingCheckout === 'pro' ? 'Processing...' : currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      {/* Full Feature Comparison Table */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Feature Breakdown Comparison</h3>
          <p className="text-xs text-slate-500">Every plan enforces the same non-negotiable 300-second maximum lifespan.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/50">
                <th className="py-3.5 px-6 font-bold text-slate-900">Feature</th>
                <th className="py-3.5 px-6 font-bold text-slate-900">Free</th>
                <th className="py-3.5 px-6 font-bold text-brand-600">Plus</th>
                <th className="py-3.5 px-6 font-bold text-slate-900">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Monthly Price</td>
                <td className="py-3 px-6 text-slate-600">₹0 / $0</td>
                <td className="py-3 px-6 font-semibold text-brand-600">₹99 / $1.49</td>
                <td className="py-3 px-6 font-semibold text-slate-900">₹249 / $3.49</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Maximum Text Size</td>
                <td className="py-3 px-6 text-slate-600">100 KB</td>
                <td className="py-3 px-6 text-slate-600">500 KB</td>
                <td className="py-3 px-6 text-slate-600">1 MB</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Maximum Image Size</td>
                <td className="py-3 px-6 text-slate-600">5 MB</td>
                <td className="py-3 px-6 text-slate-600">25 MB</td>
                <td className="py-3 px-6 text-slate-600">50 MB</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Shares Created Per Day</td>
                <td className="py-3 px-6 text-slate-600">10</td>
                <td className="py-3 px-6 text-slate-600">100</td>
                <td className="py-3 px-6 text-slate-600">500</td>
              </tr>
              <tr className="bg-brand-50/40">
                <td className="py-3 px-6 font-bold text-brand-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Expiration Timestamp</span>
                </td>
                <td className="py-3 px-6 font-bold text-brand-900">5 minutes</td>
                <td className="py-3 px-6 font-bold text-brand-900">5 minutes</td>
                <td className="py-3 px-6 font-bold text-brand-900">5 minutes</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Password Protection</td>
                <td className="py-3 px-6 text-slate-400"><X className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Burn After First View</td>
                <td className="py-3 px-6 text-slate-400"><X className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Disable Download Option</td>
                <td className="py-3 px-6 text-slate-400"><X className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-medium text-slate-900">Custom Share Alias</td>
                <td className="py-3 px-6 text-slate-400"><X className="w-4 h-4" /></td>
                <td className="py-3 px-6 text-emerald-600">Optional</td>
                <td className="py-3 px-6 text-emerald-600"><Check className="w-4 h-4" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
