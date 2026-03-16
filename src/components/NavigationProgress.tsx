"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    cleanup();
    setProgress(0);
    setVisible(true);
    setIsNavigating(true);

    // Simulate progress: fast at first, then slows down
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += Math.max(1, (90 - current) * 0.08);
      if (current >= 90) current = 90;
      setProgress(current);
    }, 50);
  }, [cleanup]);

  const completeProgress = useCallback(() => {
    cleanup();
    setProgress(100);
    setIsNavigating(false);

    // Hide after completion animation
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [cleanup]);

  // Complete progress when route changes
  useEffect(() => {
    if (isNavigating) {
      completeProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Listen for clicks on internal links (event delegation)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, mailto, tel, etc.
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Skip if navigating to the same page
      if (href === pathname) return;

      startProgress();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startProgress]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-9999 h-[2.5px] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 8px rgba(166, 138, 99, 0.6), 0 0 2px rgba(166, 138, 99, 0.4)",
          opacity: progress === 100 ? 0 : 1,
          transition:
            progress === 100
              ? "width 200ms ease-out, opacity 300ms ease-out 100ms"
              : "width 200ms ease-out",
        }}
      />
    </div>
  );
}
