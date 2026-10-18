import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, UploadCloud, Server, Trash2, ArrowRight } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: UploadCloud,
      title: 'Compose or Drop',
      desc: 'Enter text, code snippets, notes, or drop an image (JPEG, PNG, WebP, GIF, AVIF). Paste screenshots directly from your clipboard.',
    },
    {
      num: '02',
      icon: Server,
      title: 'Private Edge Ingestion',
      desc: 'Your content is validated on Cloudflare Workers and stored in private D1 tables (for text) and private Workers KV (for images). No public URLs are ever created.',
    },
    {
      num: '03',
      icon: Clock,
      title: 'The 300-Second Boundary',
      desc: 'The server sets created_at and expires_at = created_at + 300. At 300.001 seconds, all access checks strictly deny access, returning a 410 Expired response.',
    },
    {
      num: '04',
      icon: Trash2,
      title: 'Dual-Layer Physical Wipeout',
      desc: 'Cleanup runs in two ways: lazy removal on next access, and an automated Cloudflare Cron Trigger that sweeps D1 and Workers KV every 60 seconds with deletion retries.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          How BlinkShare Works
        </h1>
        <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The exact technical workflow of how your data is ingested, protected, and irreversibly wiped.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-xs relative flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-zinc-700 block mb-4">{step.num}</span>
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-4 border border-zinc-800">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 text-white rounded-3xl p-8 sm:p-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Why the 5-Minute Invariant Matters</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Unlike traditional pastebins or cloud drives that hoard files indefinitely, BlinkShare was engineered from day one around the concept of zero residual liability. No links can be extended, ensuring shared credentials, quick screenshots, and ephemeral notes vanish quickly.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold text-xs transition-colors shadow-sm"
          >
            <span>Try Sharing Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
