import React, { useState, useEffect, useMemo } from 'react';
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
  Link as LinkIcon,
  Sparkles,
  FileText,
  Code,
  Check,
  AlertCircle,
  Eye,
  Edit3,
  KeyRound,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { SensitiveTextAlert } from './SensitiveTextAlert';
import { ExpirationSelector } from './ExpirationSelector';
import { encryptText } from '../lib/e2ee';

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
  const [expirationSeconds, setExpirationSeconds] = useState<number>(300); // 1m (60s) to 5m (300s)
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const allowDownload = true;
  const [customAlias, setCustomAlias] = useState('');
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for forked content on load
  useEffect(() => {
    try {
      const forked = sessionStorage.getItem('blinkshare_fork_content');
      const forkedTitle = sessionStorage.getItem('blinkshare_fork_title');
      const forkedFormat = sessionStorage.getItem('blinkshare_fork_format');
      if (forked) {
        setContent(forked);
        if (forkedTitle) setTitle(`Fork of ${forkedTitle}`);
        if (forkedFormat) setFormat(forkedFormat as TextFormat);
        sessionStorage.removeItem('blinkshare_fork_content');
        sessionStorage.removeItem('blinkshare_fork_title');
        sessionStorage.removeItem('blinkshare_fork_format');
      }
    } catch {}
  }, []);

  // Compute text statistics
  const textBytes = useMemo(() => new TextEncoder().encode(content).length, [content]);
  const maxBytes = planLimits.maxTextBytes;
  const isOverLimit = textBytes > maxBytes;
  const percentUsed = Math.min(100, Math.round((textBytes / maxBytes) * 100));

  const stats = useMemo(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content ? content.split('\n').length : 0;
    const readingTimeMins = Math.max(1, Math.ceil(words / 200));
    return { chars, words, lines, readingTimeMins };
  }, [content]);

  // Markdown live preview render
  const renderedMarkdown = useMemo(() => {
    if (format !== 'markdown' || !content) return '';
    const rawHtml = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [format, content]);

  // Auto-detect code language on paste
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // If format is source_code and language is plaintext, perform quick auto-detection
    if (format === 'source_code' && language === 'plaintext') {
      if (val.includes('import ') || val.includes('export ') || val.includes('const ') || val.includes('function ')) {
        setLanguage('typescript');
      } else if (val.includes('def ') || val.includes('print(') || val.includes('import sys')) {
        setLanguage('python');
      } else if (val.startsWith('{') || val.startsWith('[')) {
        try {
          JSON.parse(val);
          setLanguage('json');
        } catch {}
      } else if (val.includes('SELECT ') || val.includes('INSERT INTO') || val.includes('CREATE TABLE')) {
        setLanguage('sql');
      } else if (val.includes('<!DOCTYPE') || val.includes('<html')) {
        setLanguage('html');
      }
    }
  };

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
      setError(`Content exceeds limit (${Math.round(maxBytes / 1024)} KB)`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalContent = content;
      let e2eeKey: string | null = null;

      // Handle Client-Side Zero-Knowledge End-to-End Encryption
      if (isEncrypted) {
        const { cipherText, keyB64 } = await encryptText(content);
        finalContent = cipherText;
        e2eeKey = keyB64;
      }

      const result = await api.createTextShare({
        title: title.trim() || undefined,
        textContent: finalContent,
        textFormat: format,
        syntaxLanguage: format === 'source_code' ? language : undefined,
        password: password ? password : undefined,
        burnAfterRead,
        allowDownload,
        customAlias: customAlias.trim() || undefined,
        expirationSeconds,
        isEncrypted,
      });

      // If E2EE enabled, append decryption key to URL hash so server never sees it
      if (isEncrypted && e2eeKey) {
        result.shareUrl = `${result.shareUrl}#key=${e2eeKey}`;
      }

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
          placeholder="Untitled share (optional)"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              format === 'markdown'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('source_code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              format === 'logs'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>Logs</span>
          </button>
        </div>

        {/* Markdown Live Preview Switcher */}
        {format === 'markdown' && (
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                !previewMode ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                previewMode ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* Language dropdown when Code format selected */}
        {format === 'source_code' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SyntaxLanguage)}
              className="text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-white font-medium cursor-pointer"
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

      {/* Editor Surface or Markdown Live Preview */}
      <div className="relative">
        {format === 'markdown' && previewMode ? (
          <div className="w-full min-h-[280px] max-h-[500px] overflow-auto p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-100">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Markdown Live Preview</span>
            </div>
            {content.trim() ? (
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
              />
            ) : (
              <p className="text-xs text-zinc-500 italic">Nothing to preview yet. Switch back to Edit to add text.</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Paste or type your notes, snippets, or confidential text here..."
            rows={11}
            className={`w-full p-4 text-sm bg-zinc-900 border rounded-2xl focus:outline-none focus:ring-1 focus:ring-white text-white font-mono leading-relaxed transition-all resize-y ${
              isOverLimit ? 'border-rose-500 focus:ring-rose-500' : 'border-zinc-800'
            }`}
          />
        )}

        {/* Quick action floating buttons on editor */}
        {!previewMode && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-sm p-1 rounded-lg border border-zinc-800 shadow-sm">
            <button
              type="button"
              onClick={handleCopyContent}
              title="Copy content to clipboard"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Clear text"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Live Text Analytics & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span>{stats.words.toLocaleString()} words</span>
          <span>•</span>
          <span>{stats.chars.toLocaleString()} characters</span>
          <span>•</span>
          <span>{stats.lines} lines</span>
          <span>•</span>
          <span>~{stats.readingTimeMins} min read</span>
          <span>•</span>
          <span>{(textBytes / 1024).toFixed(1)} KB</span>
        </div>

        <div className="text-[11px] text-zinc-400">
          Capacity: <span className="font-semibold text-white">{percentUsed}%</span> used
        </div>
      </div>

      {/* Configurable Expiration Selector (1 to 5 Minutes) */}
      <ExpirationSelector
        value={expirationSeconds}
        onChange={setExpirationSeconds}
      />

      {/* Advanced Privacy & Security Controls */}
      <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Zero-Knowledge E2EE Toggle */}
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
            <KeyRound className="w-3.5 h-3.5 text-white" />
            <span>Zero-Knowledge E2EE</span>
            <span className="text-[10px] text-black bg-white px-1 py-0.2 rounded font-bold">
              Free
            </span>
          </label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEncrypted}
              onChange={(e) => setIsEncrypted(e.target.checked)}
              className="rounded accent-white text-black"
            />
            <span className="text-xs text-zinc-400">Client-Side AES-256</span>
          </label>
        </div>

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
              <span>Securing & Creating Link...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-black" />
              <span>Create {Math.floor(expirationSeconds / 60)}-Minute Share Link</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
