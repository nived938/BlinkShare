import React, { useState } from 'react';
import {
  TextFormat,
  SyntaxLanguage,
  PLANS,
  CreateShareResult,
} from '@blinkshare/shared';
import {
  Copy,
  Trash2,
  Lock,
  Flame,
  Download,
  Link as LinkIcon,
  Sparkles,
  FileText,
  Code,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { SensitiveTextAlert } from './SensitiveTextAlert';

interface ShareTextTabProps {
  onSuccess: (share: CreateShareResult) => void;
}

export const ShareTextTab: React.FC<ShareTextTabProps> = ({ onSuccess }) => {
  const { plan } = useAuth();
  const planLimits = PLANS[plan];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<TextFormat>('plain_text');
  const [language, setLanguage] = useState<SyntaxLanguage>('plaintext');
  const [password, setPassword] = useState('');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [customAlias, setCustomAlias] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute byte size
  const textBytes = new TextEncoder().encode(content).length;
  const maxBytes = planLimits.maxTextBytes;
  const isOverLimit = textBytes > maxBytes;
  const percentUsed = Math.min(100, Math.round((textBytes / maxBytes) * 100));

  const handleCopyContent = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleClear = () => {
    if (content.length > 50) {
      if (!window.confirm('Discard your text content?')) return;
    }
    setContent('');
    setTitle('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter some text to share');
      return;
    }

    if (isOverLimit) {
      setError(`Content exceeds plan limit (${Math.round(maxBytes / 1024)} KB)`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.createTextShare({
        title: title.trim() || undefined,
        textContent: content,
        textFormat: format,
        syntaxLanguage: format === 'source_code' ? language : undefined,
        password: password ? password : undefined,
        burnAfterRead,
        allowDownload,
        customAlias: customAlias.trim() || undefined,
      });

      onSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Field */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled note (optional)"
          maxLength={100}
          className="w-full text-base font-medium px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-white transition-all placeholder:text-zinc-500"
        />
      </div>

      {/* Format & Language Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-zinc-900/60 rounded-xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFormat('plain_text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              format === 'plain_text'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('markdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              format === 'markdown'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('source_code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              format === 'source_code'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              format === 'json'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              format === 'logs'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>Logs</span>
          </button>
        </div>

        {/* Language dropdown when Code format selected */}
        {format === 'source_code' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SyntaxLanguage)}
              className="text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-white font-medium"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash / Shell</option>
              <option value="powershell">PowerShell</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="yaml">YAML</option>
              <option value="plaintext">Plain text</option>
            </select>
          </div>
        )}
      </div>

      {/* Sensitive text detection banner */}
      <SensitiveTextAlert text={content} />

      {/* Large Multiline Text Editor */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or type your notes, snippets, or text here... It disappears in 5 minutes."
          rows={12}
          className={`w-full p-4 text-sm bg-zinc-900 border rounded-2xl focus:outline-none focus:ring-1 focus:ring-white text-white font-mono leading-relaxed transition-all resize-y ${
            isOverLimit ? 'border-rose-500 focus:ring-rose-500' : 'border-zinc-800'
          }`}
        />

        {/* Quick action floating buttons on editor */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-sm p-1 rounded-lg border border-zinc-800 shadow-sm">
          <button
            type="button"
            onClick={handleCopyContent}
            title="Copy content to clipboard"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear text"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats bar: Characters, Bytes, Quota usage */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-4">
          <span>{content.length.toLocaleString()} characters</span>
          <span>
            {textBytes < 1024
              ? `${textBytes} bytes`
              : `${(textBytes / 1024).toFixed(1)} KB`}
          </span>
          <span className={isOverLimit ? 'text-rose-400 font-semibold' : 'text-zinc-500'}>
            Plan limit: {Math.round(maxBytes / 1024)} KB ({percentUsed}% used)
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800 font-medium">
          <span>Fixed 5-min link lifetime</span>
        </div>
      </div>

      {/* Advanced Options Accordion / Controls (Password, Burn, Download, Custom Alias) */}
      <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Password Lock */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
            <Lock className="w-3.5 h-3.5 text-white" />
            <span>Password Lock</span>
            <span className="text-[10px] text-black bg-white px-1 py-0.2 rounded font-bold">
              Free
            </span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set optional password"
            className="w-full text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
          />
        </div>

        {/* Burn After First View */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
            <Flame className="w-3.5 h-3.5 text-white" />
            <span>Burn on View</span>
            <span className="text-[10px] text-black bg-white px-1 py-0.2 rounded font-bold">
              Free
            </span>
          </label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={burnAfterRead}
              onChange={(e) => setBurnAfterRead(e.target.checked)}
              className="rounded accent-white text-black"
            />
            <span className="text-xs text-zinc-400">Delete upon 1st view</span>
          </label>
        </div>

        {/* Restrict Download */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Allow Download</span>
            <span className="text-[10px] text-black bg-white px-1 py-0.2 rounded font-bold">
              Free
            </span>
          </label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
              className="rounded accent-white text-black"
            />
            <span className="text-xs text-zinc-400">Enable download button</span>
          </label>
        </div>

        {/* Custom Alias */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
            <LinkIcon className="w-3.5 h-3.5 text-white" />
            <span>Custom Alias</span>
            <span className="text-[10px] text-black bg-white px-1 py-0.2 rounded font-bold">
              Free
            </span>
          </label>
          <input
            type="text"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            placeholder="e.g. my-note"
            maxLength={32}
            className="w-full text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-white font-mono placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-white" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Share Link Button - WHITE BUTTON */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || isOverLimit || !content.trim()}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              <span>Generating Secure 5-Minute Link...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-black" />
              <span>Create Share Link</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
