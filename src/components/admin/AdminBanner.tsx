"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FaCog } from "react-icons/fa";

export default function AdminBanner() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin || !user) return null;

  return (
    <div className="bg-surface-elevated text-text-main text-xs py-1.5 px-4 flex items-center justify-between z-50 border-b border-border-subtle">
      <div className="flex items-center gap-2">
        <span className="bg-warning text-background font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Admin
        </span>
        <span className="text-text-main/50">
          {user.displayName || user.email}
        </span>
      </div>
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-text-main/50 hover:text-primary transition-colors"
      >
        <FaCog className="w-3 h-3" />
        Panel de Admin
      </Link>
    </div>
  );
}
