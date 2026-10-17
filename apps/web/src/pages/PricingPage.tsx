import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Sparkles, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Free Utility • Zero Commercial Billing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Everything is free.{' '}
          <span className="bg-gradient-to-r from-brand-600 to-electric-cyan bg-clip-text text-transparent">
            Costs ₹0 forever.
          </span>
        </h1>

        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          BlinkShare is a free, edge-native utility. No credit card, no paid subscriptions, and no billing setup required.
          Powered entirely by Cloudflare Free-tier services (Workers, D1, and KV).
        </p>

        {/* 5-Minute Invariant Notice */}
        <div className="inline-flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium max-w-xl text-left">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>The 5-Minute Invariant:</strong> Every share permanently expires in exactly 300 seconds (5 minutes). Content is physically wiped from D1 and Workers KV.
          </span>
        </div>
      </div>

      {/* Real Free-Tier Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Card 1: Anonymous Free */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                No Sign-in Needed
              </span>
              <span className="text-2xl font-extrabold text-slate-900">₹0 / $0</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Anonymous Sharing</h3>
            <p className="text-sm text-slate-500 mb-6">
              Drop text, code, or screenshots instantly without creating an account or logging in.
            </p>

            <ul className="space-y-3.5 text-sm text-slate-700 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>10 shares / day</strong> per visitor</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>5 MB</strong> max image size (Workers KV)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>100 KB</strong> max text size (D1 SQLite)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Password protection included (Free)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Burn-after-first-view self-destruction</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Custom share aliases & secret deletion token</span>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="w-full py-3 px-4 rounded-xl text-center font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm block text-sm"
          >
            Start Sharing (Anonymous)
          </Link>
        </div>

        {/* Card 2: Free Registered Account */}
        <div className="bg-gradient-to-b from-brand-50/50 to-white rounded-3xl border-2 border-brand-500 p-8 shadow-md flex flex-col justify-between relative">
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Recommended
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
                Free Account
              </span>
              <span className="text-2xl font-extrabold text-brand-700">₹0 / $0</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Registered User</h3>
            <p className="text-sm text-slate-500 mb-6">
              Create a free account to track your share history and get a higher daily quota.
            </p>

            <ul className="space-y-3.5 text-sm text-slate-700 mb-8">
              <li className="flex items-center gap-2.5 font-medium text-slate-900">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span><strong>100 shares / day</strong> daily quota</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Personal Share Dashboard to view & delete links</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span><strong>5 MB</strong> max image size (Workers KV)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span><strong>100 KB</strong> max text size (D1 SQLite)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>All security features unlocked (Passwords, Burn)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>No credit card required. Ever.</span>
              </li>
            </ul>
          </div>

          {user ? (
            <Link
              to="/dashboard"
              className="w-full py-3 px-4 rounded-xl text-center font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 transition-all shadow-md shadow-brand-500/25 block text-sm"
            >
              Go to Your Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="w-full py-3 px-4 rounded-xl text-center font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 transition-all shadow-md shadow-brand-500/25 block text-sm"
            >
              Create Free Account
            </Link>
          )}
        </div>
      </div>

      {/* Transparent Technical Limits Table */}
      <div className="max-w-4xl mx-auto bg-slate-50/70 border border-slate-200 rounded-3xl p-8 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-6 h-6 text-brand-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-slate-900">Honest Free-Tier Technical Limits</h3>
            <p className="text-xs text-slate-500">
              Why these limits exist: We run on Cloudflare's free infrastructure tier so that we never have to charge you money.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Image Storage (KV)</span>
            <p className="text-slate-500 leading-relaxed">
              Images are stored as raw binary in Cloudflare Workers KV up to 5 MB each. Cloudflare Free KV provides 100,000 reads/day and 1 GB storage.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Database (D1)</span>
            <p className="text-slate-500 leading-relaxed">
              Short-lived text notes and metadata live in Cloudflare D1 (SQLite) with up to 100 KB per note. Free D1 provides 5M row reads/day.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Automated Deletion</span>
            <p className="text-slate-500 leading-relaxed">
              Cloudflare Cron Triggers execute every minute to purge expired objects from KV and D1. Expired shares return 410 Gone immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
