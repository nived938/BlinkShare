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
        <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const planConfig = PLANS[plan];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Dashboard Header Bar */}
      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-700">
                {planConfig.name} Plan
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {user?.email}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your active 5-minute shares and subscription quotas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/billing"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-colors shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-black" />
              <span>Billing & Plan</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quota cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 block mb-1">Daily Shares Used</span>
            <div className="text-2xl font-extrabold text-white">
              {usage?.count ?? 0}{' '}
              <span className="text-xs font-normal text-zinc-400">
                / {planConfig.maxSharesPerDay}
              </span>
            </div>
          </div>

          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 block mb-1">Max File Sizes</span>
            <div className="text-sm font-bold text-white">
              {Math.round(planConfig.maxTextBytes / 1024)} KB text •{' '}
              {Math.round(planConfig.maxImageBytes / (1024 * 1024))} MB image
            </div>
          </div>

          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 block mb-1">Expiration Policy</span>
            <div className="text-sm font-bold text-white flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Strict 5-Minute Invariant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shares Section */}
      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white">Active Live Shares</h2>
            <p className="text-xs text-zinc-400">
              Only currently unexpired shares appear here. Expired items are automatically purged.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors shadow-sm cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Share</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading active shares...</div>
        ) : shares.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900 text-white flex items-center justify-center border border-zinc-800">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white mb-1">No Active Shares</h3>
            <p className="text-xs text-zinc-400 mb-6 max-w-sm mx-auto">
              You have no active shares right now. When you share text or images, they will appear here until their 5-minute timer expires.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 active:bg-zinc-300 shadow-sm"
            >
              Create Your First Share
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {shares.map((item) => {
              const viewUrl = item.contentType === 'image' ? `/i/${item.id}` : `/t/${item.id}`;
              return (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white flex-shrink-0">
                      {item.contentType === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {item.title || item.originalFilename || `Share ${item.id}`}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
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
                      className="p-2 text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors shadow-sm"
                      title="View Share"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteShare(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
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
