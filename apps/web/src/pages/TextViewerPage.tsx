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
  RotateCcw,
} from 'lucide-react';
import { ShareContentResponse } from '@blinkshare/shared';
import { api } from '../api/client';
import { CountdownTimer } from '../components/CountdownTimer';
import { ExpiredNotice } from '../components/ExpiredNotice';
import { ReportAbuseDialog } from '../components/ReportAbuseDialog';

export const TextViewerPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'not_found' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    if (!shareId || !shareId.trim()) {
      setLoading(false);
      setErrorType('not_found');
      return;
    }
    setLoading(true);
    setErrorType(null);
    setErrorMessage(null);
    try {
      const res = await api.getShareContent(shareId.trim(), providedPass);
      setShareData(res);
      if (res.metadata?.isExpired) {
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
      } else if (err.status === 404) {
        setErrorType('not_found');
      } else {
        setErrorType('error');
        setErrorMessage(err.message || 'Unable to load this share. Please try again.');
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
      const res = await api.unlockShare(shareId.trim(), password);
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
          <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-zinc-400">Loading shared text...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return <ExpiredNotice />;
  }

  if (errorType === 'error') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl text-white">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Unable to load this share. Please try again.</h3>
        <p className="text-xs text-zinc-400 mb-6">{errorMessage || 'A network or server error occurred while retrieving this share.'}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchContent()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-black" />
            <span>Try Again</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-black" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  if (errorType === 'not_found' || !shareData) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl text-white">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">This share could not be found.</h3>
        <p className="text-xs text-zinc-400 mb-6">The requested link does not exist, was mistyped, or has already been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-black" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  // Password Unlock Screen
  if (shareData.isPasswordRequired) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl text-center text-white">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-center border border-zinc-800">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Password Protected Share</h2>
        <p className="text-xs text-zinc-400 mb-6">
          This share was locked by its creator with a password.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to unlock"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
          />

          {passwordError && (
            <p className="text-xs text-white bg-zinc-900 p-2.5 rounded-lg border border-zinc-700">
              {passwordError}
            </p>
          )}

          <button
            type="submit"
            disabled={unlocking || !password}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-black bg-white hover:bg-zinc-200 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          >
            {unlocking ? 'Verifying...' : 'Unlock Content'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-center">
          <CountdownTimer
            expiresAt={shareData.metadata.expiresAt}
            onExpired={() => setIsExpired(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-white">
      {/* Top Bar with Title, Expiry & Actions */}
      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-black bg-white px-2 py-0.5 rounded-md">
                {shareData.metadata.textFormat?.replace('_', ' ')}
              </span>
              {shareData.metadata.syntaxLanguage && shareData.metadata.syntaxLanguage !== 'plaintext' && (
                <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                  {shareData.metadata.syntaxLanguage}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
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
          <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-white flex-shrink-0" />
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
              <span>{copied ? 'Copied' : 'Copy Content'}</span>
            </button>

            {shareData.metadata.allowDownload && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Download File</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowReportDialog(true)}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Abuse</span>
          </button>
        </div>
      </div>

      {/* Main Content Viewer Surface */}
      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {shareData.metadata.textFormat === 'markdown' ? (
          <div
            className="prose prose-invert max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
          />
        ) : shareData.metadata.textFormat === 'source_code' ? (
          <pre className="overflow-x-auto rounded-2xl bg-zinc-900 p-4 border border-zinc-800 font-mono text-xs sm:text-sm">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-zinc-100 leading-relaxed break-words bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
            {shareData.textContent}
          </pre>
        )}
      </div>

      {/* Expiration disclaimer */}
      <div className="text-center text-xs text-zinc-400 mt-6 flex items-center justify-center gap-1.5">
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
