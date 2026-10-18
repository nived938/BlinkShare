import React from 'react';
import { ShieldCheck, EyeOff, Lock, Trash2, Key } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-400">
          Last updated: October 2026. BlinkShare is built with privacy as the core architecture.
        </p>
      </div>

      <div className="space-y-8 text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-8 sm:p-12 rounded-3xl border border-zinc-800 shadow-xs">
        <section>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-white" />
            1. Zero Raw IP Address Logging
          </h2>
          <p className="text-zinc-400">
            BlinkShare does not retain raw visitor IP addresses in application logs. For anti-abuse and rate limiting, we calculate a keyed one-way cryptographic hash of incoming network identifiers. This enables spam prevention without persistent visitor surveillance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-white" />
            2. The 5-Minute Deletion Guarantee
          </h2>
          <p className="text-zinc-400">
            All shared text snippets and uploaded images have an immutable server lifetime of 300 seconds (5 minutes). Once this threshold is crossed, content access is denied instantly, and physical deletion tasks sweep the database and object storage to permanently purge the data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-white" />
            3. Link Visibility & Access Model
          </h2>
          <p className="text-zinc-400">
            BlinkShare creates unique, cryptographically random, unguessable identifiers for each share. However, anyone who possesses an active, unexpired, unprotected share URL can view its contents. For sensitive material, we strongly recommend enabling password protection or burn-after-first-view.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            4. No Third-Party Tracking or Profiling
          </h2>
          <p className="text-zinc-400">
            We do not sell data, load third-party ad pixels, or profile recipients. Client-side QR codes are generated directly in your browser without transmitting destination URLs to external QR generation services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Key className="w-5 h-5 text-white" />
            5. Anonymous Early Deletion
          </h2>
          <p className="text-zinc-400">
            When creating a share without an account, you receive a secret one-time Deletion Token. Only a secure hash is saved on our servers. You can use this token to immediately revoke and destroy the share before the 5-minute countdown elapses.
          </p>
        </section>
      </div>
    </div>
  );
};
