"use client";

import { useCallback, useLayoutEffect, useEffect, useState } from "react";
import {
  markOtpSessionExpired,
  OTP_MAX_ATTEMPTS,
  readOtpSessionState,
  setOtpAttemptsUsed,
  startOtpSession,
} from "@/lib/otpSession";

type OtpChannel = "email" | "mobile";

export function useOtpSession(contact: string, channel: OtpChannel) {
  const [otpAttemptsUsed, setOtpAttemptsUsedState] = useState(0);
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<number | null>(null);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const applySession = useCallback(
    (session: ReturnType<typeof readOtpSessionState>) => {
      setOtpAttemptsUsedState(session.attemptsUsed);
      setCooldownExpiresAt(session.expiresAt);
      setCooldownSecondsLeft(session.secondsLeft);
    },
    [],
  );

  // Read sessionStorage on the client before paint so the timer shows immediately.
  useLayoutEffect(() => {
    applySession(readOtpSessionState(contact, channel));
  }, [applySession, contact, channel]);

  useEffect(() => {
    if (cooldownExpiresAt == null) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((cooldownExpiresAt - Date.now()) / 1000),
      );
      setCooldownSecondsLeft(remaining);
      if (remaining <= 0) {
        markOtpSessionExpired(contact, channel);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [contact, channel, cooldownExpiresAt]);

  const restartSession = useCallback(() => {
    const expiresAt = startOtpSession(contact, channel);
    setCooldownExpiresAt(expiresAt);
    setCooldownSecondsLeft(
      Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
    );
    setOtpAttemptsUsedState(0);
  }, [contact, channel]);

  const expireSession = useCallback(() => {
    markOtpSessionExpired(contact, channel);
    setCooldownExpiresAt(Date.now());
    setCooldownSecondsLeft(0);
  }, [contact, channel]);

  const updateAttemptsUsed = useCallback(
    (attemptsUsed: number) => {
      const nextAttempts = Math.min(attemptsUsed, OTP_MAX_ATTEMPTS);
      setOtpAttemptsUsedState(nextAttempts);
      setOtpAttemptsUsed(contact, channel, nextAttempts);
    },
    [contact, channel],
  );

  return {
    otpAttemptsUsed,
    cooldownSecondsLeft,
    restartSession,
    expireSession,
    updateAttemptsUsed,
  };
}
