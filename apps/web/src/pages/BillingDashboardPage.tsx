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
        <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Subscription & Usage</span>
            </span>
            <h1 className="text-2xl font-bold text-white mt-1">Plans & Usage</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-sm"
            >
              View Plans & Pricing
            </Link>
          </div>
        </div>

        {/* Quota Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-zinc-800">
          <div>
            <span className="text-xs text-zinc-400 block mb-1">Monthly Cost</span>
            <span className="text-2xl font-extrabold text-white">₹0 / $0</span>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">No credit card needed</p>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block mb-1">Today's Share Quota</span>
            <span className="text-2xl font-bold text-white">
              {usage ? `${usage.sharesCreatedToday} / ${usage.dailyQuotaLimit}` : '0 / 100'}
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              {usage?.dailyQuotaRemaining ?? 100} shares remaining today
            </p>
          </div>

          <div>
            <span className="text-xs text-zinc-400 block mb-1">Expiration Invariant</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Strictly 300s (5 min)</span>
            </span>
          </div>
        </div>

        {/* Storage Architecture */}
        <div className="py-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Free Infrastructure Architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <HardDrive className="w-4 h-4 text-white" />
                <span>Image Storage: Workers KV</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Raw binary image bytes are stored in Cloudflare Workers KV up to 5 MB per image.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                <Zap className="w-4 h-4 text-white" />
                <span>Database: Cloudflare D1</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Text shares, metadata, and timestamps are stored in Cloudflare D1 (SQLite) with up to 100 KB per share.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
