import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, AlertCircle, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RateLimitedButton } from '../components/RateLimitedButton';

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-zinc-950 rounded-3xl border border-zinc-800 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl text-white">BlinkShare</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>100% Free Forever • Zero Billing</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Sign Up for Free (More Usage)</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Unlock 100 shares per day (10x more usage), personal live tracking dashboard, and higher capacity.
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl mb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span><strong className="text-white">100 shares / day</strong> (vs 10 guest daily quota)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span>Personal dashboard to view and manage active shares</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span>Up to 15 MB images and 500 KB code snippets</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span>100% free forever — no credit card needed</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          <RateLimitedButton
            type="submit"
            disabled={loading}
            cooldownMs={1500}
            className="w-full py-3 rounded-xl font-bold text-xs text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create Free Account (Unlock 100 Shares/Day)'}
          </RateLimitedButton>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-white font-semibold underline underline-offset-4 hover:text-zinc-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
