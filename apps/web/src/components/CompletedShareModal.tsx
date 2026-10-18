import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  Check,
  QrCode as QrIcon,
  Download,
  Trash2,
  ExternalLink,
  PlusCircle,
  Key,
  Share2,
  ShieldCheck,
  Send,
  MessageCircle,
} from 'lucide-react';
import { CreateShareResult } from '@blinkshare/shared';
import { CountdownTimer } from './CountdownTimer';
import { api } from '../api/client';

interface CompletedShareModalProps {
  share: CreateShareResult;
  onReset: () => void;
}

export const CompletedShareModal: React.FC<CompletedShareModalProps> = ({ share, onReset }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isE2EE = share.shareUrl.includes('#key=');

  useEffect(() => {
    // Generate QR code locally in the browser
    QRCode.toDataURL(share.shareUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate local QR code', err));
  }, [share.shareUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  const handleCopyDeletionToken = async () => {
    try {
      await navigator.clipboard.writeText(share.deletionToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ephemeral BlinkShare Link',
          text: 'Open this confidential link before it expires:',
          url: share.shareUrl,
        });
      } catch {}
    } else {
      handleCopyUrl();
    }
  };

  const handleDeleteNow = async () => {
    if (!window.confirm('Are you sure you want to delete this share immediately? It will become permanently inaccessible.')) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteShare(share.id, share.deletionToken);
      setIsDeleted(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete share');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-8 animate-fadeIn text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-200 text-xs font-semibold border border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Share is Live
            </span>

            {isE2EE && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 text-white text-xs font-semibold border border-zinc-700">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Zero-Knowledge E2EE</span>
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">Your BlinkShare link is ready</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Will automatically be wiped at the end of its countdown timer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CountdownTimer expiresAt={share.expiresAt} enableAudioChime={true} />
        </div>
      </div>

      {isDeleted ? (
        <div className="my-8 p-6 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 text-white flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Share Destroyed</h4>
          <p className="text-xs text-zinc-400 mb-4">
            The share content and storage records have been permanently wiped from the edge.
          </p>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Another Share</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 my-6">
          {/* Link Box */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Public Ephemeral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={share.shareUrl}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white select-all focus:outline-none focus:ring-1 focus:ring-white"
              />
              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-white hover:bg-zinc-200 text-black shadow-sm transition-all flex-shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <a
                href={share.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black shadow-sm transition-colors flex-shrink-0"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Social Share & Quick Send Buttons */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-zinc-400 font-medium">Quick Share:</span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Native OS Web Share */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Device Share Sheet</span>
                </button>
              )}

              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Confidential BlinkShare link (expires soon): ${share.shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-700 transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(share.shareUrl)}&text=${encodeURIComponent('Confidential BlinkShare link (expires soon)')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-700 transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Confidential BlinkShare snippet:')}&url=${encodeURIComponent(share.shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-700 transition-all shadow-sm"
              >
                <span>X</span>
              </a>
            </div>
          </div>

          {/* Action Row: QR Code Toggle, Deletion Token */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* QR Code Action Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Mobile QR Code
                </span>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="text-xs font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <QrIcon className="w-3.5 h-3.5" />
                  <span>{showQr ? 'Hide' : 'Show QR'}</span>
                </button>
              </div>

              {showQr && qrDataUrl ? (
                <div className="text-center pt-2">
                  <img
                    src={qrDataUrl}
                    alt="Share QR Code"
                    className="w-48 h-48 mx-auto rounded-lg shadow-sm border border-zinc-300 bg-white p-2"
                  />
                  <div className="mt-3">
                    <a
                      href={qrDataUrl}
                      download={`blinkshare-${share.id}-qr.png`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-white hover:bg-zinc-200 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR Image</span>
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Quickly scan on a mobile phone before the timer runs out.
                </p>
              )}
            </div>

            {/* Secret Creator Deletion Token */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3 h-3 text-white" />
                  <span>Secret Deletion Token</span>
                </span>
                <button
                  onClick={handleCopyDeletionToken}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-black bg-white hover:bg-zinc-200 shadow-sm cursor-pointer"
                >
                  {copiedToken ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                Allows you to immediately delete this share early from any browser.
              </p>
              <input
                type="text"
                readOnly
                value={share.deletionToken}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-300 select-all"
              />
            </div>
          </div>

          {/* Delete Error Notice if any */}
          {deleteError && (
            <p className="text-xs text-white bg-zinc-900 border border-zinc-700 p-2.5 rounded-lg">
              {deleteError}
            </p>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-800 gap-3">
            <button
              onClick={handleDeleteNow}
              disabled={isDeleting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Share Early'}</span>
            </button>

            <button
              onClick={onReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Share Another File or Text</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
