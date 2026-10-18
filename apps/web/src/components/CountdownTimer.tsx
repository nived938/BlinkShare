import React, { useEffect, useState, useRef } from 'react';
import { Clock, Volume2, VolumeX } from 'lucide-react';
import { playExpiryChime } from '../lib/audioAlert';
import { RateLimitedButton } from './RateLimitedButton';

interface CountdownTimerProps {
  expiresAt: number; // Unix timestamp in seconds
  onExpired?: () => void;
  showIcon?: boolean;
  enableAudioChime?: boolean;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpired,
  showIcon = true,
  enableAudioChime = false,
  className = '',
}) => {
  const calculateRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, expiresAt - now);
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(enableAudioChime);
  const chimePlayedRef = useRef<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = calculateRemaining();
      setRemaining(left);

      // Play soft chime alert once when 30 seconds remain
      if (left === 30 && soundEnabled && !chimePlayedRef.current) {
        chimePlayedRef.current = true;
        playExpiryChime();
      }

      if (left <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired, soundEnabled]);

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

      {!isExpired && (
        <RateLimitedButton
          type="button"
          cooldownMs={400}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) {
              playExpiryChime();
            }
          }}
          className="p-0.5 hover:opacity-80 rounded cursor-pointer transition-opacity"
          title={soundEnabled ? 'Expiry sound alarm active (chimes at 30s)' : 'Enable 30s audio chime alarm'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3 h-3 text-current" />
          ) : (
            <VolumeX className="w-3 h-3 opacity-60 text-current" />
          )}
        </RateLimitedButton>
      )}
    </div>
  );
};
