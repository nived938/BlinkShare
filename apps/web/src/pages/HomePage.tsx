import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Clock, ShieldCheck, Flame } from 'lucide-react';
import { CreateShareResult } from '@blinkshare/shared';
import { ShareTextTab } from '../components/ShareTextTab';
import { ShareImageTab } from '../components/ShareImageTab';
import { CompletedShareModal } from '../components/CompletedShareModal';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [completedShare, setCompletedShare] = useState<CreateShareResult | null>(null);

  const handleTabChange = (newTab: 'text' | 'image') => {
    setActiveTab(newTab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full">
        {/* Homepage Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-electric-cyan animate-ping"></span>
            <span className="text-slate-900 font-bold">Share it now. Gone in five.</span>
            <span className="text-slate-300">•</span>
            <span className="text-brand-600">Zero permanent trace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Share anything.{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-electric-cyan bg-clip-text text-transparent">
              It disappears in 5 minutes.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Share text, code, screenshots, and images through one simple link. No clutter, no permanent files, just quick sharing.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            <span>Every share expires automatically after 5 minutes.</span>
          </div>
        </div>

        {/* The Sharing Card with Two Primary Tabs */}
        {completedShare ? (
          <div className="max-w-3xl mx-auto">
            <CompletedShareModal
              share={completedShare}
              onReset={() => setCompletedShare(null)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-brand-500/5 overflow-hidden transition-all">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/60 p-2 gap-2">
              <button
                type="button"
                onClick={() => handleTabChange('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === 'text'
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Share Text & Code</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === 'image'
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Share Image & Screenshot</span>
              </button>
            </div>

            {/* Tab Content Panel */}
            <div className="p-6 sm:p-8">
              {activeTab === 'text' ? (
                <ShareTextTab onSuccess={(share) => setCompletedShare(share)} />
              ) : (
                <ShareImageTab onSuccess={(share) => setCompletedShare(share)} />
              )}
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200/60 text-brand-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Hard 300-Second Boundary</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enforced strictly on Cloudflare Workers edge servers. Once 300 seconds elapse from creation, all access is instantly denied.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Private Edge Storage</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Images live in private Cloudflare R2 buckets, and text snippets in Cloudflare D1. No public bucket URLs, no permanent edge caching.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center mb-4">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Automated Physical Wipeout</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cloudflare Cron Triggers run continuous cleanup cycles every minute, permanently purging expired records and image objects with retries.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
