"use client";

import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ThreeDSChallenge {
  html: string;
  orderId: string;
  isDeviceFingerprint: boolean;
  nuveiTransactionId: string;
  statusDetail: number;
}

export interface OtpChallenge {
  orderId: string;
  nuveiTransactionId: string;
}

export interface VerifySuccessData {
  orderId: string;
  emailSent?: boolean;
}

interface UseNuveiChallengesProps {
  user: User | null;
  /** Called when verify resolves with success. Caller handles redirect, clearCart, etc. */
  onSuccess: (data: VerifySuccessData) => void;
  /** Called when verify fails. Caller sets its paymentFailed state / toast. */
  onFailed: (error: string) => void;
  /** Syncs the caller's processing flag while verify is in flight. */
  onProcessingChange: (processing: boolean) => void;
}

export interface UseNuveiChallengesReturn {
  // Challenge states
  threeDSChallenge: ThreeDSChallenge | null;
  setThreeDSChallenge: (c: ThreeDSChallenge | null) => void;
  otpChallenge: OtpChallenge | null;
  setOtpChallenge: (c: OtpChallenge | null) => void;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpSubmitting: boolean;
  otpError: string | null;
  setOtpError: (err: string | null) => void;
  challengeVerifying: boolean;

  // Refs shared with the caller's handleConfirmPayment guard logic
  paymentLockRef: MutableRefObject<boolean>;
  threeDSCompleteCalledRef: MutableRefObject<boolean>;

  // Methods
  submitOtp: () => Promise<void>;
  resetChallenges: () => void;
}

/**
 * Extracts the Nuvei payment challenge machinery that was duplicated between
 * /checkout and /pago/toxica-sin-toxicos:
 *
 *   - ThreeDSChallenge interface + state
 *   - OTP state (code, submitting, error)
 *   - paymentLockRef + threeDSCompleteCalledRef
 *   - handleVerifyResponse (success / escalated challenge / error routing)
 *   - useEffect for status_detail 35 (device fingerprint: 5s timer)
 *   - useEffect for status_detail 36 (postMessage + polling fallback, 3 min)
 *   - submitOtp (POST /api/payment/3ds-complete type=BY_OTP)
 *
 * Each page still owns:
 *   - handleConfirmPayment (different bodies: cart vs guest, installments, etc.)
 *   - JSX for the OTP modal and 3DS iframe (styling diverges per flow)
 *   - Redirects / post-success side effects (clearCart, etc.) via onSuccess callback
 */
export function useNuveiChallenges({
  user,
  onSuccess,
  onFailed,
  onProcessingChange,
}: UseNuveiChallengesProps): UseNuveiChallengesReturn {
  const [threeDSChallenge, setThreeDSChallenge] =
    useState<ThreeDSChallenge | null>(null);
  const [challengeVerifying, setChallengeVerifying] = useState(false);

  const [otpChallenge, setOtpChallenge] = useState<OtpChallenge | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const paymentLockRef = useRef(false);
  const threeDSCompleteCalledRef = useRef(false);

  // Keep callbacks in refs so the effects don't need them in deps (the timer
  // and polling shouldn't restart when parent re-renders).
  const onSuccessRef = useRef(onSuccess);
  const onFailedRef = useRef(onFailed);
  const onProcessingChangeRef = useRef(onProcessingChange);
  onSuccessRef.current = onSuccess;
  onFailedRef.current = onFailed;
  onProcessingChangeRef.current = onProcessingChange;

  // Shared verify-response handler for status 35 timer + status 36 postMessage + polling.
  const handleVerifyResponse = useRef((_data: any) => {});
  handleVerifyResponse.current = (data: any) => {
    if (data.success) {
      setThreeDSChallenge(null);
      setChallengeVerifying(false);
      onProcessingChangeRef.current(false);
      onSuccessRef.current({
        orderId: data.orderId,
        emailSent: data.emailSent,
      });
    } else if (data.challenge) {
      // Escalation: status 35 → 36 (or verify returned a nested challenge).
      threeDSCompleteCalledRef.current = false;
      onProcessingChangeRef.current(false);
      setChallengeVerifying(false);
      setThreeDSChallenge({
        html: data.challengeHtml,
        orderId: data.orderId,
        isDeviceFingerprint: false,
        nuveiTransactionId: data.nuveiTransactionId,
        statusDetail: data.statusDetail,
      });
    } else {
      paymentLockRef.current = false;
      onProcessingChangeRef.current(false);
      setChallengeVerifying(false);
      setThreeDSChallenge(null);
      onFailedRef.current(data.error || "Error al completar el pago 3DS.");
    }
  };

  // ── Status 35 (device fingerprint): 5s wait then AUTHENTICATION_CONTINUE ──
  useEffect(() => {
    if (!threeDSChallenge || threeDSChallenge.statusDetail !== 35 || !user) {
      return;
    }

    const timer = setTimeout(async () => {
      if (threeDSCompleteCalledRef.current) return;
      threeDSCompleteCalledRef.current = true;
      onProcessingChangeRef.current(true);
      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: threeDSChallenge.orderId,
            userId: user.uid,
            type: "AUTHENTICATION_CONTINUE",
            nuveiTransactionId: threeDSChallenge.nuveiTransactionId,
          }),
        });
        const data = await response.json();
        handleVerifyResponse.current(data);
      } catch {
        paymentLockRef.current = false;
        onProcessingChangeRef.current(false);
        onFailedRef.current("Error de conexión al verificar 3DS.");
        setThreeDSChallenge(null);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [threeDSChallenge, user]);

  // ── Status 36 (interactive challenge): postMessage + polling fallback ──
  // Two completion mechanisms — whichever fires first wins:
  //   1) postMessage from the Cloud Function when ACS POSTs to term_url
  //   2) Polling AUTHENTICATION_CONTINUE for up to 3 min (Nuvei returns
  //      "pending" until ACS notifies them internally of the result).
  useEffect(() => {
    if (!threeDSChallenge || threeDSChallenge.statusDetail === 35 || !user) {
      return;
    }

    async function handle3DSMessage(event: MessageEvent) {
      if (event.data?.type !== "3DS_COMPLETE") return;
      const { orderId } = event.data;
      if (!orderId || !user) return;

      setThreeDSChallenge(null);
      if (threeDSCompleteCalledRef.current) return;
      threeDSCompleteCalledRef.current = true;
      onProcessingChangeRef.current(true);

      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, userId: user.uid, type: "BY_CRES" }),
        });
        handleVerifyResponse.current(await response.json());
      } catch {
        paymentLockRef.current = false;
        onProcessingChangeRef.current(false);
        onFailedRef.current(
          "Error de conexión al completar la autenticación 3DS.",
        );
      }
    }

    window.addEventListener("message", handle3DSMessage);

    // Polling: wait 10s (user needs time to complete), then every 3s up to 3 min.
    const POLL_DELAY_MS = 10_000;
    const POLL_INTERVAL_MS = 3_000;
    const MAX_POLLS = 60;
    let pollCount = 0;
    let pollIntervalId: ReturnType<typeof setInterval> | null = null;

    const pollStartTimeout = setTimeout(() => {
      pollIntervalId = setInterval(async () => {
        if (threeDSCompleteCalledRef.current) {
          if (pollIntervalId) clearInterval(pollIntervalId);
          return;
        }
        pollCount++;
        if (pollCount > MAX_POLLS) {
          if (pollIntervalId) clearInterval(pollIntervalId);
          if (threeDSCompleteCalledRef.current) return;
          threeDSCompleteCalledRef.current = true;
          paymentLockRef.current = false;
          onProcessingChangeRef.current(false);
          onFailedRef.current(
            "Tiempo de espera agotado para la verificación 3DS. Intentá de nuevo.",
          );
          setThreeDSChallenge(null);
          try {
            await fetch("/api/payment/3ds-timeout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: threeDSChallenge.orderId }),
            });
          } catch {
            /* best effort */
          }
          return;
        }

        try {
          const response = await fetch("/api/payment/3ds-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: threeDSChallenge.orderId,
              userId: user!.uid,
              type: "AUTHENTICATION_CONTINUE",
              nuveiTransactionId: threeDSChallenge.nuveiTransactionId,
            }),
          });
          const data = await response.json();

          if (data.pending || data.stillPending) return;

          if (data.success || data.error || data.challenge) {
            if (threeDSCompleteCalledRef.current) return;
            threeDSCompleteCalledRef.current = true;
            if (pollIntervalId) clearInterval(pollIntervalId);
            setChallengeVerifying(true);
            setThreeDSChallenge(null);
            handleVerifyResponse.current(data);
          }
        } catch {
          // Network error — keep polling
        }
      }, POLL_INTERVAL_MS);
    }, POLL_DELAY_MS);

    return () => {
      window.removeEventListener("message", handle3DSMessage);
      clearTimeout(pollStartTimeout);
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [threeDSChallenge, user]);

  // ── OTP submission ──
  const submitOtp = useCallback(async () => {
    if (!otpChallenge || !user) return;
    if (!otpCode.trim()) {
      setOtpError("Ingresá el código OTP.");
      return;
    }
    setOtpSubmitting(true);
    setOtpError(null);
    try {
      const response = await fetch("/api/payment/3ds-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: otpChallenge.orderId,
          userId: user.uid,
          type: "BY_OTP",
          nuveiTransactionId: otpChallenge.nuveiTransactionId,
          otpCode: otpCode.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setOtpChallenge(null);
        onSuccessRef.current({
          orderId: data.orderId,
          emailSent: data.emailSent,
        });
      } else {
        setOtpError(data.error || "Código incorrecto. Intentá de nuevo.");
      }
    } catch {
      setOtpError("Error de conexión. Intentá de nuevo.");
    } finally {
      setOtpSubmitting(false);
    }
  }, [otpChallenge, otpCode, user]);

  const resetChallenges = useCallback(() => {
    setThreeDSChallenge(null);
    setOtpChallenge(null);
    setOtpCode("");
    setOtpError(null);
    setOtpSubmitting(false);
    setChallengeVerifying(false);
    paymentLockRef.current = false;
    threeDSCompleteCalledRef.current = false;
  }, []);

  return {
    threeDSChallenge,
    setThreeDSChallenge,
    otpChallenge,
    setOtpChallenge,
    otpCode,
    setOtpCode,
    otpSubmitting,
    otpError,
    setOtpError,
    challengeVerifying,
    paymentLockRef,
    threeDSCompleteCalledRef,
    submitOtp,
    resetChallenges,
  };
}
