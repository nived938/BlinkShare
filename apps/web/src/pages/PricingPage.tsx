import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Sparkles, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  const prices = {
    free: { USD: 0, INR: 0 },
    plus: {
      monthly: { USD: 4.99, INR: 299 },
      yearly: { USD: 3.99, INR: 239 }, // per month when paid yearly
    },
    pro: {
      monthly: { USD: 14.99, INR: 799 },
      yearly: { USD: 11.99, INR: 639 },
    },
  };

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const faqs = [
    {
      q: 'Why do shares still expire in 5 minutes even on paid plans?',
      a: 'The 300-second immutable lifetime is BlinkShare’s core security guarantee. Pro and Team plans provide higher daily share quotas, larger file uploads, batch sharing, and analytics—without compromising on the zero residual liability guarantee.',
    },
    {
      q: 'Can I upgrade, downgrade, or cancel anytime?',
      a: 'Yes. Subscriptions are billed on a flexible monthly or annual basis with zero lock-in contracts. You can change plans or cancel at any time from your account dashboard.',
    },
    {
      q: 'What happens when a 5-minute timer expires?',
      a: 'Once the 300-second mark is reached, our Cloudflare edge servers immediately return 410 Gone. The text and binary image data are physically swept and purged from our database and key-value storage.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit/debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, and UPI / NetBanking for Indian INR payments.',
    },
    {
      q: 'Is there a free trial for Pro or Team plans?',
      a: 'You can test all core BlinkShare capabilities on the Free Starter plan with zero credit card required. If you need a demo or custom trial for your team, please reach out.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Simple, Transparent Pricing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Flexible plans for every share.{' '}
          <span className="text-zinc-400 block sm:inline">
            Zero residual risk.
          </span>
        </h1>

        <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Upgrade for higher daily volume, larger file uploads, and team controls—while keeping the strict 5-minute ephemeral privacy guarantee.
        </p>

        {/* 5-Minute Invariant Reminder */}
        <div className="inline-flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium max-w-xl text-left">
          <Clock className="w-4 h-4 text-white flex-shrink-0" />
          <span>
            <strong className="text-white">The 5-Minute Invariant:</strong> Every share across all plans strictly expires after 300 seconds. Content is physically wiped from edge storage.
          </span>
        </div>
      </div>

      {/* Controls: Billing Cycle & Currency Toggles */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        {/* Billing cycle pill */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] bg-zinc-800 text-white px-1.5 py-0.5 rounded-full border border-zinc-700 font-semibold">
              Save 20%
            </span>
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currency === 'INR'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            INR (₹)
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        {/* Plan 1: Free Starter */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                No Card Required
              </span>
              <span className="text-2xl font-extrabold text-white">
                {currencySymbol}0
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Free Starter</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Instant, anonymous text and image sharing without creating an account.
            </p>

            <ul className="space-y-3.5 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">10 shares / day</strong> per visitor</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">5 MB</strong> max image upload</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">100 KB</strong> max text size</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>PBKDF2 Password protection (Free)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Burn-after-first-view self-destruct</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Custom share aliases & secret deletion tokens</span>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-colors shadow-sm block text-sm"
          >
            Start Free
          </Link>
        </div>

        {/* Plan 2: Pro Individual (Featured) */}
        <div className="bg-zinc-950 rounded-3xl border-2 border-white p-8 shadow-2xl flex flex-col justify-between relative">
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-black bg-white px-3 py-1 rounded-full">
                Pro Individual
              </span>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-white">
                  {currencySymbol}
                  {billingCycle === 'monthly'
                    ? prices.plus.monthly[currency]
                    : prices.plus.yearly[currency]}
                </span>
                <span className="text-xs text-zinc-400 block">/ month</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro Individual</h3>
            <p className="text-sm text-zinc-400 mb-6">
              For developers, designers, and creators who need higher capacity and link management.
            </p>

            <ul className="space-y-3.5 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5 font-medium text-white">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">100 shares / day</strong> daily quota</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">15 MB</strong> max image upload</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">500 KB</strong> max text size</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Personal Share History Dashboard</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Batch image multi-sharing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Detailed share view count analytics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Priority Cloudflare edge ingestion</span>
              </li>
            </ul>
          </div>

          {user ? (
            <Link
              to="/dashboard"
              className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-md block text-sm"
            >
              Manage Subscription in Dashboard
            </Link>
          ) : (
            <Link
              to="/signup?plan=plus"
              className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-md block text-sm"
            >
              Get Pro Individual
            </Link>
          )}
        </div>

        {/* Plan 3: Team / Business */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                For Teams
              </span>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-white">
                  {currencySymbol}
                  {billingCycle === 'monthly'
                    ? prices.pro.monthly[currency]
                    : prices.pro.yearly[currency]}
                </span>
                <span className="text-xs text-zinc-400 block">/ month</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Team / Business</h3>
            <p className="text-sm text-zinc-400 mb-6">
              For engineering teams, security operations, and businesses with high volume needs.
            </p>

            <ul className="space-y-3.5 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5 font-medium text-white">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">500 shares / day</strong> high-capacity quota</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">25 MB</strong> max image upload (KV Max)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">1 MB</strong> max text size</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Multi-seat Team Workspace</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Custom domain alias branding</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Centralized security & audit logs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>24/7 Priority support & API tokens</span>
              </li>
            </ul>
          </div>

          <Link
            to={user ? '/dashboard' : '/signup?plan=pro'}
            className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-colors shadow-sm block text-sm"
          >
            Get Team Plan
          </Link>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-5xl mx-auto mb-20 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Detailed Plan Comparison</h2>
        <p className="text-xs text-zinc-400 mb-8 text-center max-w-xl mx-auto">
          Compare all features side-by-side. Every plan includes our 5-minute ephemeral wipeout guarantee.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold">Features & Limits</th>
                <th className="py-4 px-4 font-semibold">Free Starter</th>
                <th className="py-4 px-4 font-semibold text-white">Pro Individual</th>
                <th className="py-4 px-4 font-semibold">Team / Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              <tr>
                <td className="py-4 px-4 font-medium text-white">Daily Share Quota</td>
                <td className="py-4 px-4 text-zinc-300">10 / day</td>
                <td className="py-4 px-4 text-white font-semibold">100 / day</td>
                <td className="py-4 px-4 text-zinc-300 font-semibold">500 / day</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Max Image Upload</td>
                <td className="py-4 px-4 text-zinc-300">5 MB</td>
                <td className="py-4 px-4 text-white font-semibold">15 MB</td>
                <td className="py-4 px-4 text-zinc-300 font-semibold">25 MB</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Max Text / Code Size</td>
                <td className="py-4 px-4 text-zinc-300">100 KB</td>
                <td className="py-4 px-4 text-white font-semibold">500 KB</td>
                <td className="py-4 px-4 text-zinc-300 font-semibold">1 MB</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Hard Expiration Timer</td>
                <td className="py-4 px-4 text-zinc-300">Strictly 300s (5 min)</td>
                <td className="py-4 px-4 text-white font-semibold">Strictly 300s (5 min)</td>
                <td className="py-4 px-4 text-zinc-300 font-semibold">Strictly 300s (5 min)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Password Protection (PBKDF2)</td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Burn-After-First-View</td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Personal Dashboard & History</td>
                <td className="py-4 px-4 text-zinc-600">—</td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Batch Multi-Image Sharing</td>
                <td className="py-4 px-4 text-zinc-600">—</td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Detailed View Analytics</td>
                <td className="py-4 px-4 text-zinc-600">—</td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Multi-Seat Team Workspace</td>
                <td className="py-4 px-4 text-zinc-600">—</td>
                <td className="py-4 px-4 text-zinc-600">—</td>
                <td className="py-4 px-4 text-white"><Check className="w-4 h-4 text-white" /></td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-medium text-white">Priority 24/7 Support</td>
                <td className="py-4 px-4 text-zinc-600">—</td>
                <td className="py-4 px-4 text-zinc-300">Standard</td>
                <td className="py-4 px-4 text-white font-semibold">Priority 24/7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing FAQs */}
      <div className="max-w-4xl mx-auto mb-20">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Frequently Asked Questions</h2>
        <p className="text-xs text-zinc-400 mb-8 text-center">
          Have questions about BlinkShare pricing and plans? We're here to help.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-white flex-shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise Contact CTA Banner */}
      <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Need a Custom Dedicated Deployment?
        </h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8">
          We offer dedicated VPC instances, custom security retention audits, and enterprise SSO integration.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-black font-bold text-sm shadow-md hover:bg-zinc-200 transition-transform hover:scale-105 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>Contact Enterprise Sales</span>
        </Link>
      </div>
    </div>
  );
};
