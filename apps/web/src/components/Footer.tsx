import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ShieldCheck, Clock, Trash2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-bold text-lg text-slate-900">BlinkShare</span>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed">
              "Share it now. Gone in five."
              <br />
              Ultra-fast, ephemeral text and image sharing. Cloudflare edge-powered with guaranteed 300-second automated teardown.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200/60 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>Hard 5-minute maximum lifetime for all shares.</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-600 transition-colors">Share Text & Code</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-brand-600 transition-colors">Share Images</Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-brand-600 transition-colors">Core Features</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-brand-600 transition-colors">Pricing & Plans</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-brand-600 transition-colors">How It Works</Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">Privacy & Trust</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/report-abuse" className="hover:text-brand-600 transition-colors">Report Abuse</Link>
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero IP logging & encrypted transit</span>
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-500">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Automated D1 & R2 wipeout</span>
              </li>
            </ul>
          </div>

          {/* Account & Billing */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="hover:text-brand-600 transition-colors">Sign In</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-brand-600 transition-colors">Create Account</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-brand-600 transition-colors">My Active Shares</Link>
              </li>
              <li>
                <Link to="/dashboard/billing" className="hover:text-brand-600 transition-colors">Billing & Quota</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BlinkShare. Built for ephemeral privacy and speed.</p>
          <p className="flex items-center gap-1">
            Running on Cloudflare Edge (Workers, D1, R2)
          </p>
        </div>
      </div>
    </footer>
  );
};
