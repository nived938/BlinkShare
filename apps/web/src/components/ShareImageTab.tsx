import React, { useState, useEffect, useRef } from 'react';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  CreateShareResult,
  PLANS,
  isAllowedImageMimeType,
} from '@blinkshare/shared';
import {
  UploadCloud,
  X,
  Lock,
  Flame,
  Download,
  Link as LinkIcon,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { ExpirationSelector } from './ExpirationSelector';

interface ShareImageTabProps {
  onSuccess: (share: CreateShareResult) => void;
}

export const ShareImageTab: React.FC<ShareImageTabProps> = ({ onSuccess }) => {
  const { plan } = useAuth();
  const planLimits = PLANS[plan];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Settings
  const [expirationSeconds, setExpirationSeconds] = useState<number>(300);
  const [password, setPassword] = useState('');
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [customAlias, setCustomAlias] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Storage configuration health
  const [storageInfo, setStorageInfo] = useState<{
    storageMode: string;
    storageAvailable: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    api.getStorageHealth()
      .then((data) => {
        setStorageInfo({
          storageMode: data.storageMode,
          storageAvailable: data.storageAvailable,
          message: data.message,
        });
      })
      .catch(() => {
        // Fallback: assume available in local dev
        setStorageInfo({
          storageMode: 'kv',
          storageAvailable: true,
          message: 'Cloudflare Workers KV storage active.',
        });
      });
  }, []);

  // Clipboard paste listener to allow pasting screenshots directly
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (storageInfo && !storageInfo.storageAvailable) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [planLimits.maxImageBytes, storageInfo]);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate MIME type
    if (!isAllowedImageMimeType(file.type)) {
      setError(`Unsupported image format (${file.type || 'unknown'}). Allowed: JPEG, PNG, WebP, GIF, AVIF.`);
      return;
    }

    // Validate size against plan limit
    if (file.size > planLimits.maxImageBytes) {
      setError(`Image size exceeds your ${planLimits.name} plan limit of ${Math.round(planLimits.maxImageBytes / (1024 * 1024))} MB.`);
      return;
    }

    setSelectedFile(file);

    // Create local object URL for preview and read dimensions
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    if (isUploading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageDimensions(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadAndShare = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Step 1: Initialize upload session with server
      const initResult = await api.initImageUpload({
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        fileMimeType: selectedFile.type,
        password: password || undefined,
        burnAfterRead,
        allowDownload,
        customAlias: customAlias.trim() || undefined,
        expirationSeconds,
      });

      // Step 2: Upload binary stream directly to upload endpoint
      await api.uploadImageBinary(
        initResult.uploadUrl,
        selectedFile,
        (percent) => setUploadProgress(percent),
        abortController.signal
      );

      // Step 3: Finalize upload session and receive public share link
      const finalizeResult = await api.finalizeImageUpload(initResult.uploadToken, expirationSeconds);

      onSuccess(finalizeResult);
    } catch (err: any) {
      if (err.message !== 'Upload canceled') {
        setError(err.message || 'Image upload failed. Please try again.');
      }
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage Mode Notice Banners */}
      {storageInfo && !storageInfo.storageAvailable && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 flex items-start gap-3 text-zinc-300 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-white">Workers KV Binding Not Detected</p>
            <p className="text-zinc-400 leading-relaxed">
              Cloudflare Workers KV (<code className="bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-200">IMAGE_STORE</code>) is not bound.
              <strong> Text sharing remains 100% functional.</strong>
            </p>
          </div>
        </div>
      )}

      {storageInfo?.storageAvailable && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-xs shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0"></span>
          <div>
            <span className="font-semibold text-white">100% Free Edge Storage Active: </span>
            <span className="text-zinc-400">Images stored in Cloudflare Workers KV (up to 5 MB per image, deleted after 5 min). Zero billing required.</span>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
        disabled={storageInfo?.storageAvailable === false}
        className="hidden"
      />

      {/* Main Drag & Drop / Preview Surface */}
      {!selectedFile ? (
        <div
          onDrop={storageInfo?.storageAvailable === false ? (e) => e.preventDefault() : handleDrop}
          onDragOver={storageInfo?.storageAvailable === false ? (e) => e.preventDefault() : handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (storageInfo?.storageAvailable === false) return;
            fileInputRef.current?.click();
          }}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
            storageInfo?.storageAvailable === false
              ? 'border-zinc-800 bg-zinc-950/60 opacity-60 cursor-not-allowed'
              : isDragging
              ? 'border-white bg-zinc-900 scale-[1.01] cursor-pointer'
              : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950 hover:bg-zinc-900/40 cursor-pointer'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-sm border border-zinc-800">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            Drag & drop your image here, or <span className="text-zinc-300 underline">browse</span>
          </h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
            Or simply press <kbd className="font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-200 shadow-2xs">Ctrl+V</kbd> / <kbd className="font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-200 shadow-2xs">Cmd+V</kbd> anywhere to paste a screenshot directly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-zinc-500">
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full font-medium text-zinc-300">JPEG</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full font-medium text-zinc-300">PNG</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full font-medium text-zinc-300">WebP</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full font-medium text-zinc-300">GIF</span>
            <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full font-medium text-zinc-300">AVIF</span>
            <span className="text-zinc-500">• Up to {Math.round(planLimits.maxImageBytes / (1024 * 1024))} MB</span>
          </div>
        </div>
      ) : (
        /* Image Selected State */
        <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Thumbnail Preview */}
            <div className="relative group w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center flex-shrink-0">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={selectedFile.name}
                  className="w-full h-full object-contain p-1"
                />
              )}
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/80 hover:bg-white hover:text-black text-white transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* File Metadata & Actions */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-white flex-shrink-0" />
                  <h4 className="text-base font-bold text-white truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  {imageDimensions && (
                    <span>
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  )}
                  <span className="uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono text-[10px] text-zinc-300">
                    {selectedFile.type.split('/')[1] || 'image'}
                  </span>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Uploading to Workers KV Storage...</span>
                    <span className="text-white">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="text-xs text-zinc-400 hover:text-white hover:underline"
                    >
                      Cancel Upload
                    </button>
                  </div>
                </div>
              )}

              {/* Replace image button - WHITE BUTTON */}
              {!isUploading && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-black bg-white hover:bg-zinc-200 px-3.5 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-black" />
                    <span>Choose Different Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configurable Expiration Selector (1 to 5 Minutes) */}
      <ExpirationSelector
        value={expirationSeconds}
        onChange={setExpirationSeconds}
      />

      {/* Advanced Options Bar (Password, Burn, Download, Custom Alias) */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Password */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1">
            <Lock className="w-3.5 h-3.5 text-white" />
            <span>Password Protection</span>
            <span className="text-[10px] text-black bg-white px-1 py-0.2 rounded font-bold">
              Free
            </span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set optional password"
            className="w-full text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
          />
        </div>

        {/* Burn after read */}
        <div>
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
            <span className="text-xs text-zinc-400">Delete after 1st view</span>
          </label>
        </div>

        {/* Download restriction */}
        <div>
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
            <span className="text-xs text-zinc-400">Recipients can download</span>
          </label>
        </div>

        {/* Custom Alias */}
        <div>
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
            placeholder="e.g. my-photo"
            maxLength={32}
            className="w-full text-xs px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white font-mono placeholder-zinc-500"
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

      {/* Create Image Link Button - WHITE BUTTON */}
      <div>
        <button
          type="button"
          onClick={handleUploadAndShare}
          disabled={!selectedFile || isUploading || storageInfo?.storageAvailable === false}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-black bg-white hover:bg-zinc-200 active:bg-zinc-300 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              <span>Uploading & Securing Share...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-black" />
              <span>Create {Math.floor(expirationSeconds / 60)}-Minute Image Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
