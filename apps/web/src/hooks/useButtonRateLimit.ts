import { useState, useRef, useCallback } from 'react';

export interface UseButtonRateLimitOptions {
  cooldownMs?: number; // Minimum cooldown between clicks, default 1500ms
  onRateLimited?: (secondsRemaining: number) => void;
}

export function useButtonRateLimit(options: UseButtonRateLimitOptions = {}) {
  const { cooldownMs = 1500, onRateLimited } = options;
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const lastClickRef = useRef<number>(0);
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const executeWithRateLimit = useCallback(
    (action: () => void | Promise<void>): boolean => {
      const now = Date.now();
      const elapsed = now - lastClickRef.current;

      if (elapsed < cooldownMs) {
        const remaining = Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000));
        setSecondsRemaining(remaining);
        setIsRateLimited(true);
        if (onRateLimited) {
          onRateLimited(remaining);
        }
        return false;
      }

      // Record click timestamp
      lastClickRef.current = now;
      setIsRateLimited(true);
      const initialRemaining = Math.max(1, Math.ceil(cooldownMs / 1000));
      setSecondsRemaining(initialRemaining);

      // Clear any existing timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        const timePassed = Date.now() - lastClickRef.current;
        const left = Math.max(0, Math.ceil((cooldownMs - timePassed) / 1000));
        setSecondsRemaining(left);
        if (left <= 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 300);

      timerRef.current = setTimeout(() => {
        setIsRateLimited(false);
        setSecondsRemaining(0);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      }, cooldownMs);

      // Execute the desired action
      action();
      return true;
    },
    [cooldownMs, onRateLimited]
  );

  return {
    isRateLimited,
    secondsRemaining,
    executeWithRateLimit,
  };
}
