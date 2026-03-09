"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FaCog } from "react-icons/fa";

export default function AdminBanner() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin || !user) return null;

  return (
    <div className="bg-gray-900 text-white text-xs py-1.5 px-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <span className="bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Admin
        </span>
        <span className="text-gray-300">
          {user.displayName || user.email}
        </span>
      </div>
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
      >
        <FaCog className="w-3 h-3" />
        Panel de Admin
      </Link>
    </div>
  );
}
