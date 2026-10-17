import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Shield, Flame, Lock, QrCode, Sparkles, Zap, Image, FileCode2, EyeOff } from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Mandatory 300-Second Lifetime',
      desc: 'Every link has an immutable server-side expiration of 5 minutes. No client clock tampering or URL tricks can bypass it.',
    },
    {
      icon: Shield,
      title: 'Cloudflare Edge Architecture',
      desc: 'Built with Cloudflare Workers, D1, and R2. Low-latency edge execution without single-point database bottlenecks.',
    },
    {
      icon: Image,
      title: 'Secure Image Streaming',
      desc: 'Images are stored in private Cloudflare R2 buckets and delivered via streaming Worker responses. No direct or permanent R2 links.',
    },
    {
      icon: FileCode2,
      title: 'Markdown & Multi-Language Code',
      desc: 'Live syntax highlighting for TypeScript, JavaScript, Python, SQL, Bash, HTML, CSS, JSON, and safe sanitized Markdown.',
    },
    {
      icon: Flame,
      title: 'Burn After First View',
      desc: 'Atomic database state transitions guarantee that one-time shares are incinerated upon first access.',
    },
    {
      icon: Lock,
      title: 'PBKDF2 Password Protection',
      desc: 'Encrypt access with PBKDF2 salt hashing and rate-limited verification before content is unlocked.',
    },
    {
      icon: QrCode,
      title: 'Local Client-Side QR Generation',
      desc: 'Instant QR code rendering on your device. Share URLs are never sent to third-party QR tracking services.',
    },
    {
      icon: EyeOff,
      title: 'Zero Permanent Storage & No IP Logging',
      desc: 'We never retain visitor IP addresses in logs. Once a share expires, text and image records are physically wiped.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
          <Zap className="w-3.5 h-3.5 text-brand-600" />
          <span>Engineered for Ephemeral Privacy</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Everything you need.{' '}
          <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
            Nothing you leave behind.
          </span>
        </h1>

        <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Combining the best features of text snippet tools and modern image dropboxes into one edge-native platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/60 text-brand-600 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="p-8 sm:p-12 bg-gradient-to-r from-brand-600 via-indigo-600 to-electric-cyan rounded-3xl text-white text-center shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to share without the clutter?</h2>
        <p className="text-sm text-white/90 max-w-xl mx-auto mb-8">
          No sign up required for basic sharing. Open the homepage, paste your text or drop your screenshot, and get a link.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-brand-700 font-bold text-sm shadow-md hover:bg-slate-50 transition-transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create a 5-Minute Share</span>
        </Link>
      </div>
    </div>
  );
};
