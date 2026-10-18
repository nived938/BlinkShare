import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Clock,
  Sparkles,
  KeyRound,
  FileCode,
  GitFork,
  Eye,
  Sliders,
  Volume2,
  Share2,
  ListOrdered,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Clock,
      title: 'Configurable 1 to 5 Minute Expiration',
      desc: 'Set custom self-destruct timers from 1 minute (60s) up to 5 minutes (300s) with quick presets and interactive slider.',
    },
    {
      icon: KeyRound,
      title: 'Zero-Knowledge E2EE Encryption',
      desc: 'Client-side AES-GCM 256 encryption. The decryption key resides exclusively in the URL hash and never touches our servers.',
    },
    {
      icon: Eye,
      title: 'Live Markdown Split Preview',
      desc: 'Real-time sanitized Markdown preview tab directly in the composer before creating your share link.',
    },
    {
      icon: FileCode,
      title: 'Developer CLI Raw Endpoint',
      desc: 'Instantly curl plaintext content in terminals and automation scripts via /api/shares/:id/raw.',
    },
    {
      icon: GitFork,
      title: 'One-Click Fork & Clone',
      desc: 'Duplicate any unexpired share into a fresh composer session with its own brand new countdown timer.',
    },
    {
      icon: Volume2,
      title: 'Audio Expiry Warning Alarm',
      desc: 'Built-in Web Audio chime alerts you at 30 seconds before irreversible server deletion.',
    },
    {
      icon: Share2,
      title: 'Native Device & Social Sharing',
      desc: 'Trigger your native mobile/desktop OS share sheet or share directly to WhatsApp, Telegram, and X.',
    },
    {
      icon: ListOrdered,
      title: 'Code Syntax & Line Numbers',
      desc: 'Full syntax highlighting across 14 languages with interactive line numbers and clean code copying.',
    },
    {
      icon: Sliders,
      title: 'Image Filters, Zoom & EXIF Stripper',
      desc: 'Interactive image pan, zoom, monochrome invert filters, and automatic privacy-preserving metadata handling.',
    },
    {
      icon: Lock,
      title: 'PBKDF2 Passwords & Burn on View',
      desc: 'Cryptographic password locking and atomic burn-after-first-view self-destruct functionality.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>100% Free Forever • Zero Billing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Everything is 100% free.{' '}
          <span className="text-zinc-400 block sm:inline">
            Zero cost forever.
          </span>
        </h1>

        <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          BlinkShare is a modern, high-speed ephemeral utility. No subscriptions, no credit cards, and no billing requirements.
          Powered directly by Cloudflare Free-Tier edge architecture.
        </p>

        {/* 1-5 Minute Invariant Notice */}
        <div className="inline-flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium max-w-xl text-left">
          <Clock className="w-4 h-4 text-white flex-shrink-0" />
          <span>
            <strong className="text-white">Custom 1 to 5 Minute Lifetime:</strong> Choose exact self-destruct times between 60s (1 min) and 300s (5 min). Content is physically wiped from D1 and Workers KV.
          </span>
        </div>
      </div>

      {/* Free Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Anonymous Free */}
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-sm flex flex-col justify-between hover:border-zinc-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                Guest Free (10 Shares/Day)
              </span>
              <span className="text-2xl font-extrabold text-white">₹0 / $0</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Guest Sharing</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Drop text, code, or images as a guest, or sign up for free to unlock 10x more usage.
            </p>

            <ul className="space-y-3.5 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">10 shares / day</strong> guest daily limit</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">1m to 5m</strong> customizable expiration</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">5 MB</strong> image upload (Workers KV)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">100 KB</strong> text snippet size</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Zero-Knowledge AES-GCM 256 E2EE</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Passwords, Burn-on-view, & Custom Aliases</span>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-colors shadow-sm block text-sm"
          >
            Start Sharing as Guest
          </Link>
        </div>

        {/* Free Registered Account */}
        <div className="bg-zinc-950 rounded-3xl border-2 border-white p-8 shadow-2xl flex flex-col justify-between relative">
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Enhanced Free Tier
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-black bg-white px-3 py-1 rounded-full">
                Free Account
              </span>
              <span className="text-2xl font-extrabold text-white">₹0 / $0</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Free Registered User</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Create a free account to track active live shares and unlock higher capacity.
            </p>

            <ul className="space-y-3.5 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2.5 font-medium text-white">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">100 shares / day</strong> daily quota (10x more usage)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">15 MB</strong> max image upload</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span><strong className="text-white">500 KB</strong> max text snippet size</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>Personal Live Shares Dashboard</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>All 10+ Pro Features Included</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-white flex-shrink-0" />
                <span>No credit card required. Ever.</span>
              </li>
            </ul>
          </div>

          {user ? (
            <Link
              to="/dashboard"
              className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-md block text-sm"
            >
              Go to Your Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="w-full py-3.5 px-4 rounded-xl text-center font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-md block text-sm"
            >
              Sign Up for Free (Get More Usage)
            </Link>
          )}
        </div>
      </div>

      {/* 10 Best Features Showcase */}
      <div className="max-w-6xl mx-auto mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            10 Power Features Included For Free
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            Everything you need for confidential, ephemeral sharing without paying a single rupee or dollar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{feat.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Box */}
      <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Ready to experience ephemeral sharing?
        </h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8">
          Sign up for free to unlock 100 shares/day (10x more usage), live tracking, and higher upload capacity. 100% free forever.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-black font-bold text-sm shadow-md hover:bg-zinc-200 transition-transform hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Sign Up for Free (More Usage)</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-bold text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span>Start Sharing Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
