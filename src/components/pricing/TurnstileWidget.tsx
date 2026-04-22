"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
  action?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement | string,
        opts: TurnstileRenderOptions,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

interface TurnstileWidgetProps {
  /** Called every time Turnstile produces a fresh token (~5 min lifetime). */
  onToken: (token: string | null) => void;
  /** Visual theme of the small widget (Managed mode shows a tiny check). */
  theme?: "light" | "dark" | "auto";
}

/**
 * Renders a Turnstile widget and emits tokens through onToken.
 * When the token expires Cloudflare triggers the expired-callback and we
 * automatically reset the widget so the next attempt has a fresh token.
 * onToken(null) is emitted while a new token is being computed.
 */
export default function TurnstileWidget({
  onToken,
  theme = "dark",
}: TurnstileWidgetProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!scriptReady || !sitekey || !divRef.current || widgetIdRef.current) {
      return;
    }
    if (!window.turnstile) return;

    widgetIdRef.current = window.turnstile.render(divRef.current, {
      sitekey,
      callback: (token) => onToken(token),
      "error-callback": () => onToken(null),
      "expired-callback": () => {
        onToken(null);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            /* ignore */
          }
        }
      },
      "timeout-callback": () => onToken(null),
      theme,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, sitekey, onToken, theme]);

  if (!sitekey) {
    // En dev sin variable setea fail-open local para no bloquear.
    if (typeof window !== "undefined") {
      console.warn(
        "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not configured",
      );
    }
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <div ref={divRef} />
    </>
  );
}
