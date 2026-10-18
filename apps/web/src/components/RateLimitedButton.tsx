import React, { useState, useRef, useEffect } from 'react';

export interface RateLimitedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  cooldownMs?: number; // Minimum ms between clicks (default: 1500ms)
  showRateLimitBadge?: boolean; // Show brief "Wait Xs" if clicked while rate-limited
}

export const RateLimitedButton: React.FC<RateLimitedButtonProps> = ({
  cooldownMs = 1500,
  showRateLimitBadge = true,
  onClick,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const [inCooldown, setInCooldown] = useState(false);
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(0);

  const lastClickTimeRef = useRef<number>(0);
  const cooldownTimerRef = useRef<any>(null);
  const warningTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    const elapsed = now - lastClickTimeRef.current;

    if (elapsed < cooldownMs) {
      // Spam detected / button is rate-limited!
      e.preventDefault();
      e.stopPropagation();

      const left = Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000));
      setRemainingSecs(left);
      setShowSpamWarning(true);

      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        setShowSpamWarning(false);
      }, 1200);

      return;
    }

    // First click permitted: activate rate-limit cooldown
    lastClickTimeRef.current = now;
    setInCooldown(true);
    setShowSpamWarning(false);

    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      setInCooldown(false);
      setShowSpamWarning(false);
    }, cooldownMs);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        {...props}
        disabled={disabled || inCooldown}
        onClick={handleClick}
        className={`${className} transition-all duration-150 ${
          inCooldown ? 'opacity-80 cursor-not-allowed select-none' : ''
        }`}
      >
        {children}
      </button>

      {/* Floating Rate Limit Warning Popover */}
      {showRateLimitBadge && showSpamWarning && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-50 animate-bounce">
          Rate limited: wait {remainingSecs}s
        </div>
      )}
    </div>
  );
};
