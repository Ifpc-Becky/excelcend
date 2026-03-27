"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, User, Bell } from "lucide-react";

interface HeaderProps {
  userEmail?: string;
}

export default function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-[240px] right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 hidden sm:block">
          請求書送付ダッシュボード
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Plan badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-blue-700">Standardプラン</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[140px] truncate">
              {userEmail ?? "ユーザー"}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white border border-slate-100 shadow-lg py-1.5 z-20">
                <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs text-slate-400">ログイン中</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{userEmail}</p>
                </div>
                <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                  <User size={15} className="text-slate-400" />
                  アカウント設定
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={15} />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
