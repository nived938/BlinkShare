import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500">
          Effective date: October 2026. Please read these terms carefully before using BlinkShare.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-600 leading-relaxed bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using BlinkShare, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Acceptable Use Policy</h2>
          <p>
            You agree not to use BlinkShare to transmit, share, or store:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Malicious software, viruses, phishing lures, or exploits.</li>
            <li>Content that infringes any copyright, patent, trademark, or trade secret.</li>
            <li>Child sexual abuse material (CSAM) or any unlawful and abusive content.</li>
            <li>Non-consensual personal information or doxxing material.</li>
            <li>Automated spam or denial-of-service abuse against the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Ephemeral Nature of the Service</h2>
          <p>
            BlinkShare is designed exclusively for short-term, ephemeral sharing. All data is automatically destroyed after 5 minutes (300 seconds). BlinkShare is not an archive or permanent backup service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">4. DMCA & Abuse Takedowns</h2>
          <p>
            If you believe content on BlinkShare violates your rights or our acceptable use guidelines, please use our{' '}
            <Link to="/report-abuse" className="text-brand-600 underline font-medium">
              Abuse Reporting form
            </Link>. Because all shares terminate automatically after five minutes, prompt reporting is essential.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. Disclaimer of Warranties</h2>
          <p>
            BlinkShare is provided "as is" and "as available" without warranties of any kind, whether express or implied.
          </p>
        </section>
      </div>
    </div>
  );
};
