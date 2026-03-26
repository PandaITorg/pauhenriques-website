"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaTimes } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BannerPromo {
  id: string;
  description: string;
  code: string;
}

export default function AnnouncementBanner() {
  const [promos, setPromos] = useState<BannerPromo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function fetchBannerPromos() {
      try {
        const q = query(
          collection(db, "promotions"),
          where("isActive", "==", true),
          where("showAsBanner", "==", true),
        );
        const snapshot = await getDocs(q);
        const now = new Date();
        const active: BannerPromo[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const validFrom = data.rules?.validFrom?.toDate?.() || new Date(0);
          const validUntil = data.rules?.validUntil?.toDate?.() || new Date(0);

          if (now >= validFrom && now <= validUntil && data.description) {
            active.push({
              id: doc.id,
              description: data.description,
              code: data.code,
            });
          }
        });

        // Check dismissed state
        const dismissedIds = active.filter((p) => {
          try {
            return localStorage.getItem(`dismissed-banner-${p.id}`) === "1";
          } catch {
            return false;
          }
        }).map((p) => p.id);

        const visible = active.filter((p) => !dismissedIds.includes(p.id));
        setPromos(visible);
        if (visible.length > 0) {
          setTimeout(() => setVisible(true), 100);
        }
      } catch {
        // Silently fail — banner is non-critical
      }
    }

    fetchBannerPromos();
  }, []);

  // Rotate promos every 5s if there are multiple
  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos.length]);

  if (promos.length === 0 || dismissed) return null;

  const current = promos[currentIndex];

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      // Dismiss all current banner promos
      promos.forEach((p) => {
        try {
          localStorage.setItem(`dismissed-banner-${p.id}`, "1");
        } catch { /* quota exceeded */ }
      });
    }, 200);
  };

  return (
    <div
      className={`bg-primary/90 text-white transition-all duration-300 ${
        visible ? "max-h-20 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3 relative">
        <p className="text-xs sm:text-sm text-center leading-snug">
          <span className="font-medium">{current.description}</span>
          {current.code && (
            <span className="ml-2 font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {current.code}
            </span>
          )}
          <Link
            href="/tienda"
            className="ml-2 underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            Ver tienda
          </Link>
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-3 p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar banner"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
