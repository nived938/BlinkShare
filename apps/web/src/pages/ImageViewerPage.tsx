import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Copy,
  Check,
  Flag,
  Clock,
  Lock,
  Flame,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { ShareMetadata } from '@blinkshare/shared';
import { api } from '../api/client';
import { CountdownTimer } from '../components/CountdownTimer';
import { ExpiredNotice } from '../components/ExpiredNotice';
import { ReportAbuseDialog } from '../components/ReportAbuseDialog';

export const ImageViewerPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();

  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'not_found' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [metadata, setMetadata] = useState<ShareMetadata | null>(null);

  // Password state
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Zoom and viewer controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMetadata = async () => {
    if (!shareId || !shareId.trim()) {
      setLoading(false);
      setErrorType('not_found');
      return;
    }
    setLoading(true);
    setErrorType(null);
    setErrorMessage(null);
    try {
      const res = await api.getShare(shareId.trim());
      setMetadata(res.metadata);
      setIsPasswordRequired(Boolean(res.isPasswordRequired));
      if (res.metadata?.isExpired) {
        setIsExpired(true);
      }
    } catch (err: any) {
      if (err.status === 410) {
        setIsExpired(true);
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
    fetchMetadata();
  }, [shareId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareId || !password) return;
    setUnlocking(true);
    setPasswordError(null);
    try {
      // Test password by unlocking share
      await api.unlockShare(shareId, password);
      setUnlockedPassword(password);
      setIsPasswordRequired(false);
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect password');
    } finally {
      setUnlocking(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  // Build the streaming image URL
  const imageUrl = shareId
    ? `/api/shares/${shareId}/image${unlockedPassword ? `?password=${encodeURIComponent(unlockedPassword)}` : ''}`
    : '';

  const downloadUrl = shareId
    ? `/api/shares/${shareId}/image?download=true${unlockedPassword ? `&password=${encodeURIComponent(unlockedPassword)}` : ''}`
    : '';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading shared image...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return <ExpiredNotice />;
  }

  if (errorType === 'error') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Unable to load this share. Please try again.</h3>
        <p className="text-xs text-slate-500 mb-6">{errorMessage || 'A network or server error occurred while retrieving this share.'}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchMetadata()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  if (errorType === 'not_found' || !metadata) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">This share could not be found.</h3>
        <p className="text-xs text-slate-500 mb-6">The requested link does not exist, was mistyped, or has already been removed.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  // Password Unlock Screen
  if (isPasswordRequired) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-brand-500/5 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Protected Image</h2>
        <p className="text-xs text-slate-500 mb-6">
          This image requires a password set by the creator.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
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
            {unlocking ? 'Unlocking...' : 'View Image'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
          <CountdownTimer
            expiresAt={metadata.expiresAt}
            onExpired={() => setIsExpired(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                Image Share
              </span>
              {metadata.fileSize && (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {(metadata.fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate max-w-md">
              {metadata.originalFilename || 'Shared Image'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <CountdownTimer
              expiresAt={metadata.expiresAt}
              onExpired={() => setIsExpired(true)}
            />
          </div>
        </div>

        {/* Burn notice if applicable */}
        {metadata.burnAfterRead && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Burn-after-first-view enabled:</strong> This image self-destructs upon closing or refreshing this page.
            </span>
          </div>
        )}

        {/* Action & Zoom Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-600 font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            {metadata.allowDownload && (
              <a
                href={downloadUrl}
                download={metadata.originalFilename || `blinkshare-${shareId}.png`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Image</span>
              </a>
            )}

            <button
              onClick={() => setShowReportDialog(true)}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Report Abuse"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Display Surface */}
      <div
        ref={containerRef}
        className="bg-slate-950/90 rounded-3xl border border-slate-800 p-4 sm:p-8 flex items-center justify-center min-h-[500px] overflow-auto shadow-2xl"
      >
        <img
          src={imageUrl}
          alt={metadata.originalFilename || 'Shared visual'}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg transition-transform duration-150"
          onError={() => setIsExpired(true)}
        />
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span>Streamed directly from Cloudflare R2 storage. Permanently destroyed in 5 minutes.</span>
      </div>

      {/* Report Abuse Modal */}
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
