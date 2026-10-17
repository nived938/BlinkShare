import React, { useState } from 'react';
import { Flag, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export const ReportAbusePage: React.FC = () => {
  const [shareId, setShareId] = useState('');
  const [reason, setReason] = useState<'copyright' | 'malware' | 'illegal' | 'personal_data' | 'spam' | 'other'>('malware');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareId.trim()) {
      setError('Please provide a Share ID or full URL');
      return;
    }

    // Extract ID if full URL pasted
    let cleanedId = shareId.trim();
    if (cleanedId.includes('/t/')) {
      cleanedId = cleanedId.split('/t/')[1]?.split('?')[0] || cleanedId;
    } else if (cleanedId.includes('/s/')) {
      cleanedId = cleanedId.split('/s/')[1]?.split('?')[0] || cleanedId;
    } else if (cleanedId.includes('/i/')) {
      cleanedId = cleanedId.split('/i/')[1]?.split('?')[0] || cleanedId;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.reportAbuse(cleanedId, reason, details);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit abuse report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Report Abuse or Violation</h1>
            <p className="text-xs text-slate-500">All BlinkShare items are purged automatically within 5 minutes.</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-lg mb-1">Report Received</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Our automated anti-abuse systems have flagged the identifier. Thank you for helping keep BlinkShare secure.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setShareId('');
                setDetails('');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Share ID or Share Link
              </label>
              <input
                type="text"
                required
                value={shareId}
                onChange={(e) => setShareId(e.target.value)}
                placeholder="e.g. 7kF9x0Lm or https://blinkshare.io/t/7kF9x0Lm"
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the violation..."
                rows={4}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting Report...' : 'Submit Abuse Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
