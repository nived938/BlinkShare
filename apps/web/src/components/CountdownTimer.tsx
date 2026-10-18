import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: number; // Unix timestamp in seconds
  onExpired?: () => void;
  showIcon?: boolean;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpired,
  showIcon = true,
  className = '',
}) => {
  const calculateRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, expiresAt - now);
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = calculateRemaining();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = remaining > 0 && remaining <= 60;
  const isExpired = remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-colors ${
        isExpired
          ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
          : isUrgent
          ? 'bg-white text-black font-bold border border-white animate-pulse'
          : 'bg-zinc-900 text-white border border-zinc-700'
      } ${className}`}
      title="Server-enforced expiration countdown"
    >
      {showIcon && <Clock className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>
        {isExpired ? 'Expired' : `Expires in ${formattedTime}`}
      </span>
    </div>
  );
};
