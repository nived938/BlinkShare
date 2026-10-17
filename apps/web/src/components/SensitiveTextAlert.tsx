import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { detectSensitiveContent } from '@blinkshare/shared';

interface SensitiveTextAlertProps {
  text: string;
}

export const SensitiveTextAlert: React.FC<SensitiveTextAlertProps> = ({ text }) => {
  const detection = useMemo(() => detectSensitiveContent(text), [text]);

  if (!detection.hasSensitiveContent) return null;

  return (
    <div className="p-3.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 animate-fadeIn">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-950">
          Potential Sensitive Data Detected: {detection.matches.join(', ')}
        </p>
        <p className="text-amber-800/90 mt-0.5 leading-relaxed">
          Your text appears to include credentials, private keys, or API tokens. BlinkShare links expire in 5 minutes, but anyone with the link can view it before expiration.
        </p>
      </div>
    </div>
  );
};
