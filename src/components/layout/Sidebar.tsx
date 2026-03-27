"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  SendHorizonal,
  Users,
  Settings,
  FileSpreadsheet,
  UploadCloud,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/upload", label: "アップロード", icon: UploadCloud },
  { href: "/logs", label: "送信ログ", icon: SendHorizonal },
  { href: "/customers", label: "顧客管理", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-[240px] bg-white border-r border-slate-100 flex flex-col z-20">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={16} className="text-white" />
          </div>
          <span className="font-display text-base font-bold text-slate-900 tracking-tight">
            ExcelCend
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-blue-600" : "text-slate-400"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge → /pricing リンク */}
      <div className="p-4 border-t border-slate-100">
        <Link
          href="/pricing"
          className="block rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 hover:from-blue-100 hover:to-indigo-100 transition-colors"
        >
          <p className="text-xs text-slate-500 mb-0.5">現在のプラン</p>
          <p className="text-sm font-semibold text-blue-700">Standardプラン</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>今月の送信数</span>
              <span>12 / 50</span>
            </div>
            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "24%" }} />
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-2 font-medium">
            プランを変更する →
          </p>
        </Link>
      </div>
    </aside>
  );
}
