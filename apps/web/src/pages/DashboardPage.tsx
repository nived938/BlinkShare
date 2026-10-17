import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  Clock,
  Trash2,
  ExternalLink,
  PlusCircle,
  CreditCard,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserShareItem, PLANS } from '@blinkshare/shared';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { CountdownTimer } from '../components/CountdownTimer';

export const DashboardPage: React.FC = () => {
  const { user, plan, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [shares, setShares] = useState<UserShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ count: number; limit: number; remaining: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [sharesRes, usageRes] = await Promise.all([
        api.getUserShares(),
        api.getUsage(),
      ]);
      setShares(sharesRes.shares);
      setUsage({
        count: usageRes.sharesCreatedToday,
        limit: usageRes.dailyQuotaLimit,
        remaining: usageRes.dailyQuotaRemaining,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user]);

  const handleDeleteShare = async (id: string) => {
    if (!window.confirm('Delete this share now? Content will be immediately purged.')) return;
    setDeletingId(id);
    try {
      await api.deleteUserShare(id);
      setShares((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete share');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const planConfig = PLANS[plan];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Dashboard Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                {planConfig.name} Plan
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {user?.email}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your active 5-minute shares and subscription quotas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/billing"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>Billing & Plan</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quota cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Daily Shares Used</span>
            <div className="text-2xl font-extrabold text-slate-900">
              {usage?.count ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {planConfig.maxSharesPerDay}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Max File Sizes</span>
            <div className="text-sm font-bold text-slate-900">
              {Math.round(planConfig.maxTextBytes / 1024)} KB text •{' '}
              {Math.round(planConfig.maxImageBytes / (1024 * 1024))} MB image
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Expiration Policy</span>
            <div className="text-sm font-bold text-brand-700 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Strict 5-Minute Invariant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shares Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Live Shares</h2>
            <p className="text-xs text-slate-500">
              Only currently unexpired shares appear here. Expired items are automatically purged.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Share</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading active shares...</div>
        ) : shares.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">No Active Shares</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              You have no active shares right now. When you share text or images, they will appear here until their 5-minute timer expires.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Create Your First Share
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {shares.map((item) => {
              const viewUrl = item.contentType === 'image' ? `/i/${item.id}` : `/t/${item.id}`;
              return (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                      {item.contentType === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {item.title || item.originalFilename || `Share ${item.id}`}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>{item.contentType}</span>
                        <span>•</span>
                        <span>{item.viewCount} views</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <CountdownTimer
                      expiresAt={item.expiresAt}
                      onExpired={() => setShares((prev) => prev.filter((s) => s.id !== item.id))}
                    />

                    <Link
                      to={viewUrl}
                      target="_blank"
                      className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Share"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteShare(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Share Now"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
