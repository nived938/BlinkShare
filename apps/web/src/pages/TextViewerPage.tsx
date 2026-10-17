import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';

import {
  Copy,
  Check,
  Download,
  Lock,
  Flame,
  Flag,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { ShareContentResponse } from '@blinkshare/shared';
import { api } from '../api/client';
import { CountdownTimer } from '../components/CountdownTimer';
import { ExpiredNotice } from '../components/ExpiredNotice';
import { ReportAbuseDialog } from '../components/ReportAbuseDialog';

export const TextViewerPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [shareData, setShareData] = useState<ShareContentResponse | null>(null);

  // Password state
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Actions
  const [copied, setCopied] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const fetchContent = async (providedPass?: string) => {
    if (!shareId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getShareContent(shareId, providedPass);
      setShareData(res);
      if (res.metadata.isExpired) {
        setIsExpired(true);
      }
    } catch (err: any) {
      if (err.status === 410) {
        setIsExpired(true);
      } else if (err.status === 401 && err.isPasswordRequired) {
        setShareData({
          metadata: err.metadata,
          isPasswordRequired: true,
        });
      } else {
        setError(err.message || 'Unable to load share');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [shareId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareId || !password) return;
    setUnlocking(true);
    setPasswordError(null);
    try {
      const res = await api.unlockShare(shareId, password);
      setShareData(res);
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect password');
    } finally {
      setUnlocking(false);
    }
  };

  const handleCopy = async () => {
    if (!shareData?.textContent) return;
    try {
      await navigator.clipboard.writeText(shareData.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    if (!shareData?.textContent) return;
    const format = shareData.metadata.textFormat;
    let ext = 'txt';
    let mime = 'text/plain';

    if (format === 'markdown') {
      ext = 'md';
      mime = 'text/markdown';
    } else if (format === 'json') {
      ext = 'json';
      mime = 'application/json';
    } else if (format === 'source_code') {
      const lang = shareData.metadata.syntaxLanguage;
      if (lang === 'javascript') ext = 'js';
      else if (lang === 'typescript') ext = 'ts';
      else if (lang === 'python') ext = 'py';
      else if (lang === 'html') ext = 'html';
      else if (lang === 'css') ext = 'css';
      else if (lang === 'sql') ext = 'sql';
      else if (lang === 'bash') ext = 'sh';
      else if (lang === 'powershell') ext = 'ps1';
    }

    const blob = new Blob([shareData.textContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shareData.metadata.title || `blinkshare-${shareId}`}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render markdown safely
  const renderedMarkdown = useMemo(() => {
    if (shareData?.metadata.textFormat !== 'markdown' || !shareData.textContent) {
      return '';
    }
    const rawHtml = marked.parse(shareData.textContent, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [shareData]);

  // Syntax highlighting for code
  const highlightedCode = useMemo(() => {
    if (!shareData?.textContent) return '';
    const lang = shareData.metadata.syntaxLanguage || 'plaintext';
    const grammar = Prism.languages[lang] || Prism.languages.plaintext;
    return Prism.highlight(shareData.textContent, grammar, lang);
  }, [shareData]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Retrieving 5-minute share...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return <ExpiredNotice />;
  }

  if (error || !shareData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-1">Share Not Found</h3>
        <p className="text-xs text-slate-500 mb-6">{error || 'This link may have already been purged or deleted.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  // Password Unlock Screen
  if (shareData.isPasswordRequired) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-brand-500/5 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Password Protected Share</h2>
        <p className="text-xs text-slate-500 mb-6">
          This share was locked by its creator with a password.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to unlock"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {passwordError && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {passwordError}
            </p>
          )}

          <button
            type="submit"
            disabled={unlocking || !password}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {unlocking ? 'Verifying...' : 'Unlock Content'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
          <CountdownTimer
            expiresAt={shareData.metadata.expiresAt}
            onExpired={() => setIsExpired(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar with Title, Expiry & Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                {shareData.metadata.textFormat?.replace('_', ' ')}
              </span>
              {shareData.metadata.syntaxLanguage && shareData.metadata.syntaxLanguage !== 'plaintext' && (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {shareData.metadata.syntaxLanguage}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {shareData.metadata.title || 'Untitled Share'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <CountdownTimer
              expiresAt={shareData.metadata.expiresAt}
              onExpired={() => setIsExpired(true)}
            />
          </div>
        </div>

        {/* Burn notice if applicable */}
        {shareData.isBurned && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Burn-after-first-view triggered:</strong> This share has already been destroyed on the server and cannot be viewed again.
            </span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Content'}</span>
            </button>

            {shareData.metadata.allowDownload && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowReportDialog(true)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Abuse</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewer Surface */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 overflow-hidden">
        {shareData.metadata.textFormat === 'markdown' ? (
          <div
            className="prose prose-slate max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
          />
        ) : shareData.metadata.textFormat === 'source_code' ? (
          <pre className="overflow-x-auto rounded-2xl bg-slate-50 p-4 border border-slate-200 font-mono text-xs sm:text-sm">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-slate-800 leading-relaxed break-words bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {shareData.textContent}
          </pre>
        )}
      </div>

      {/* Expiration disclaimer */}
      <div className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span>This shared text is automatically deleted from Cloudflare storage after 5 minutes.</span>
      </div>

      {/* Report abuse modal */}
      {shareId && (
        <ReportAbuseDialog
          shareId={shareId}
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </div>
  );
};
