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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full">
        {/* Homepage Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-white font-bold">Share it now. Gone in five.</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Zero permanent trace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Share anything.{' '}
            <span className="text-zinc-400 block sm:inline">
              It disappears in 5 minutes.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Share text, code snippets, notes, and images through one simple link. 100% free, no sign-up required, and strictly purged.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-white" />
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
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden transition-all">
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-2 gap-2">
              <button
                type="button"
                onClick={() => handleTabChange('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === 'text'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
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
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
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
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xs hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-2">Hard 300-Second Boundary</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enforced strictly on Cloudflare Workers edge servers. Once 300 seconds elapse from creation, all access is instantly denied.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xs hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-2">Private Edge Storage</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Images live in private Cloudflare Workers KV storage, and text snippets in Cloudflare D1. No public URLs, no permanent edge caching.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xs hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center mb-4">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white mb-2">Automated Physical Wipeout</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Cloudflare Cron Triggers run continuous cleanup cycles every minute, permanently purging expired records and image objects with retries.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
