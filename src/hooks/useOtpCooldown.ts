'use client';

import * as React from 'react';

const COOLDOWN_DURATION = 60; // seconds

export function useOtpCooldown(email: string) {
  const [cooldown, setCooldown] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const getStorageKey = React.useCallback(() => {
    return `nexpark_otp_cooldown_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }, [email]);

  const calculateRemainingTime = React.useCallback(() => {
    if (!email) return 0;
    const storedExpiry = localStorage.getItem(getStorageKey());
    if (!storedExpiry) return 0;

    const expiryTime = parseInt(storedExpiry, 10);
    const now = Date.now();
    if (isNaN(expiryTime) || now >= expiryTime) {
      localStorage.removeItem(getStorageKey());
      return 0;
    }

    return Math.ceil((expiryTime - now) / 1000);
  }, [email, getStorageKey]);

  const stopTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = React.useCallback((seconds: number) => {
    stopTimer();
    setCooldown(seconds);

    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Sync timer with local storage expiry
  const syncTimer = React.useCallback(() => {
    const remaining = calculateRemainingTime();
    if (remaining > 0) {
      startTimer(remaining);
    } else {
      setCooldown(0);
      stopTimer();
    }
  }, [calculateRemainingTime, startTimer, stopTimer]);

  const startCooldown = React.useCallback(() => {
    if (!email) return;
    const expiryTime = Date.now() + COOLDOWN_DURATION * 1000;
    localStorage.setItem(getStorageKey(), expiryTime.toString());
    startTimer(COOLDOWN_DURATION);
  }, [email, getStorageKey, startTimer]);

  // Effect: sync on mount, email change, and focus
  React.useEffect(() => {
    syncTimer();

    const handleFocus = () => {
      syncTimer();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      stopTimer();
      window.removeEventListener('focus', handleFocus);
    };
  }, [email, syncTimer, stopTimer]);

  return {
    cooldown,
    startCooldown,
    isCooldownActive: cooldown > 0,
  };
}
