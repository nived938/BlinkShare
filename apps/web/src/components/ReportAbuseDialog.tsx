import React, { useState } from 'react';
import { Flag, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

interface ReportAbuseDialogProps {
  shareId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportAbuseDialog: React.FC<ReportAbuseDialogProps> = ({ shareId, isOpen, onClose }) => {
  const [reason, setReason] = useState<'copyright' | 'malware' | 'illegal' | 'personal_data' | 'spam' | 'other'>('malware');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.reportAbuse(shareId, reason, details);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 animate-fadeIn relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-white mb-3">
          <Flag className="w-5 h-5" />
          <h3 className="font-bold text-lg text-white">Report Abuse</h3>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-white mx-auto mb-3" />
            <h4 className="font-semibold text-white mb-1">Report Received</h4>
            <p className="text-xs text-zinc-400 mb-6">
              Thank you for keeping BlinkShare safe. Remember that all shares are automatically purged after 5 minutes regardless.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-zinc-400">
              Submit a report for share <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded text-white border border-zinc-800">{shareId}</code>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
              >
                <option value="malware">Malware / Phishing / Fraud</option>
                <option value="illegal">Illegal or Prohibited Material</option>
                <option value="personal_data">Personal Data / Leaked Credentials</option>
                <option value="copyright">Copyright Infringement (DMCA)</option>
                <option value="spam">Spam / Unsolicited Promotion</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Briefly explain the issue..."
                rows={3}
                className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-white bg-zinc-900 p-2.5 rounded-lg border border-zinc-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-200 disabled:opacity-40 shadow-sm transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
