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
      desc: 'Built with Cloudflare Workers, D1, and Workers KV. Low-latency edge execution without single-point database bottlenecks.',
    },
    {
      icon: Image,
      title: 'Secure Image Streaming',
      desc: 'Images are stored as raw binary in Cloudflare Workers KV and delivered via streaming Worker responses. No public URLs.',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
          <Zap className="w-3.5 h-3.5 text-white" />
          <span>Engineered for Ephemeral Privacy</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Everything you need.{' '}
          <span className="text-zinc-400 block sm:inline">
            Nothing you leave behind.
          </span>
        </h1>

        <p className="text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Combining the best features of text snippet tools and modern image dropboxes into one edge-native platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{feat.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="p-8 sm:p-12 bg-zinc-950 border border-zinc-800 rounded-3xl text-white text-center shadow-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to share without the clutter?</h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8">
          No sign up required for basic sharing. Open the homepage, paste your text or drop your screenshot, and get a link.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-black font-bold text-sm shadow-md hover:bg-zinc-200 transition-transform hover:scale-105 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>Create a 5-Minute Share</span>
        </Link>
      </div>
    </div>
  );
};
