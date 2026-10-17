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
      });

      // Step 2: Upload binary stream directly to R2 upload endpoint
      await api.uploadImageBinary(
        initResult.uploadUrl,
        selectedFile,
        (percent) => setUploadProgress(percent),
        abortController.signal
      );

      // Step 3: Finalize upload session and receive public 5-minute share link
      const finalizeResult = await api.finalizeImageUpload(initResult.uploadToken);

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
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-900">Workers KV Binding Not Detected</p>
            <p className="text-amber-800 leading-relaxed">
              Cloudflare Workers KV (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">IMAGE_STORE</code>) is not bound.
              <strong> Text sharing remains 100% functional.</strong>
            </p>
          </div>
        </div>
      )}

      {storageInfo?.storageAvailable && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <div>
            <span className="font-semibold text-emerald-800">100% Free Edge Storage Active: </span>
            <span className="text-emerald-700">Images stored in Cloudflare Workers KV (up to 5 MB per image, deleted after 5 min). Zero billing required.</span>
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
              ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
              : isDragging
              ? 'border-brand-500 bg-brand-50/70 scale-[1.01] cursor-pointer'
              : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-brand-100 to-indigo-100 flex items-center justify-center text-brand-600 shadow-sm border border-brand-200/50">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Drag & drop your image here, or <span className="text-brand-600 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Or simply press <kbd className="font-mono bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-700 shadow-2xs">Ctrl+V</kbd> / <kbd className="font-mono bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-700 shadow-2xs">Cmd+V</kbd> anywhere to paste a screenshot directly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full font-medium">JPEG</span>
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full font-medium">PNG</span>
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full font-medium">WebP</span>
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full font-medium">GIF</span>
            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-full font-medium">AVIF</span>
            <span className="text-slate-400">• Up to {Math.round(planLimits.maxImageBytes / (1024 * 1024))} MB</span>
          </div>
        </div>
      ) : (
        /* Image Selected State */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Thumbnail Preview */}
            <div className="relative group w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
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
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white transition-colors"
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
                  <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <h4 className="text-base font-bold text-slate-900 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  {imageDimensions && (
                    <span>
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  )}
                  <span className="uppercase bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px]">
                    {selectedFile.type.split('/')[1] || 'image'}
                  </span>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-brand-700">Uploading to Edge Storage...</span>
                    <span className="text-slate-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-electric-cyan transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Cancel Upload
                    </button>
                  </div>
                </div>
              )}

              {/* Replace image button */}
              {!isUploading && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Choose Different Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Options Bar (Password, Burn, Download, Custom Alias) */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Password */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Lock className="w-3.5 h-3.5 text-brand-600" />
            <span>Password Protection</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-normal">
              Free
            </span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set optional password"
            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Burn after read */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Burn on View</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-normal">
              Free
            </span>
          </label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={burnAfterRead}
              onChange={(e) => setBurnAfterRead(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-600">Delete after 1st view</span>
          </label>
        </div>

        {/* Download restriction */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Allow Download</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-normal">
              Free
            </span>
          </label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-600">Recipients can download</span>
          </label>
        </div>

        {/* Custom Alias */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <LinkIcon className="w-3.5 h-3.5 text-cyan-600" />
            <span>Custom Alias</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-normal">
              Free
            </span>
          </label>
          <input
            type="text"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            placeholder="e.g. my-photo"
            maxLength={32}
            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Image Link Button */}
      <div>
        <button
          type="button"
          onClick={handleUploadAndShare}
          disabled={!selectedFile || isUploading || storageInfo?.storageAvailable === false}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-electric-cyan hover:from-brand-700 hover:via-indigo-700 hover:to-electric-blue shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-base"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Uploading & Securing Share...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Create Image Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
