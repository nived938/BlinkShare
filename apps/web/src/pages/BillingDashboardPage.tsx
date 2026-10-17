import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, HardDrive, Clock, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

export const BillingDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [usage, setUsage] = useState<{
    sharesCreatedToday: number;
    dailyQuotaLimit: number;
    dailyQuotaRemaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    api.getUsage()
      .then((data) => setUsage(data))
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
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>100% Free Forever</span>
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Usage & Quotas</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              View Free Quotas
            </Link>
          </div>
        </div>

        {/* Quota Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Monthly Cost</span>
            <span className="text-2xl font-extrabold text-slate-900">₹0 / $0</span>
            <p className="text-xs text-emerald-600 mt-0.5 font-medium">No credit card needed</p>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Today's Share Quota</span>
            <span className="text-2xl font-bold text-slate-900">
              {usage ? `${usage.sharesCreatedToday} / ${usage.dailyQuotaLimit}` : '0 / 100'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {usage?.dailyQuotaRemaining ?? 100} shares remaining today
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Expiration Invariant</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Strictly 300s (5 min)</span>
            </span>
          </div>
        </div>

        {/* Storage Architecture */}
        <div className="py-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Free Infrastructure Architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                <HardDrive className="w-4 h-4 text-brand-600" />
                <span>Image Storage: Workers KV</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Raw binary image bytes are stored in Cloudflare Workers KV up to 5 MB per image.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                <Zap className="w-4 h-4 text-brand-600" />
                <span>Database: Cloudflare D1</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Text shares, metadata, and timestamps are stored in Cloudflare D1 (SQLite) with up to 100 KB per share.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
