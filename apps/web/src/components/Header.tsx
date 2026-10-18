import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, User, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, plan } = useAuth();

  const navLinks = [
    { label: 'Share', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Privacy', path: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                BlinkShare
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                5-Min Expiry
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-zinc-900 border border-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800"
              >
                <User className="w-4 h-4 text-zinc-300" />
                <span className="max-w-[120px] truncate">{user.email}</span>
                <span className="text-[10px] font-bold uppercase bg-white text-black px-1.5 py-0.5 rounded">
                  {plan}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Sign Up Free (More Usage)</span>
                </Link>
              </div>
            )}

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Share Now</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-6 space-y-2 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 text-zinc-200 font-medium border border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-300" />
                  <span className="truncate">{user.email}</span>
                </div>
                <span className="text-xs uppercase bg-white text-black px-2 py-0.5 rounded font-bold">
                  {plan}
                </span>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 rounded-xl font-bold text-xs text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700"
                >
                  Sign Up for Free (10x More Usage)
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 rounded-lg text-zinc-300 font-medium hover:bg-zinc-900 text-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-2.5 rounded-xl font-semibold text-black bg-white hover:bg-zinc-200 shadow-md"
            >
              Share Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
