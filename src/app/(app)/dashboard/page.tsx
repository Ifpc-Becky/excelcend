import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FileSpreadsheet,
  TrendingUp,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Plus,
  Users,
  ClipboardList,
} from "lucide-react";

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
interface SendLog {
  id: string;
  company_name: string;
  to_email: string;
  subject: string;
  status: string;
  created_at: string;
}

// -------------------------------------------------------
// ユーティリティ
// -------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${h}:${min}`;
}

// -------------------------------------------------------
// 空状態（最近の履歴セクション用）
// -------------------------------------------------------
function RecentLogsEmpty() {
  return (
    <div className="px-6 py-14 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <ClipboardList size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">
        まだ送信履歴はありません
      </p>
      <p className="text-xs text-slate-400 leading-relaxed mb-5">
        請求書をアップロードして送信すると、<br />
        ここに履歴が表示されます。
      </p>
      <Link href="/upload" className="btn-primary text-xs px-3 py-2">
        <Plus size={13} />
        最初の請求書を送る
      </Link>
    </div>
  );
}

// -------------------------------------------------------
// ページ本体（Server Component）
// -------------------------------------------------------
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params  = await searchParams;
  const supabase = await createClient();

  // 認証
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // -------------------------------------------------------
  // send_logs を一括取得（RLSで自分のデータのみ返る）
  // -------------------------------------------------------
  const { data: allLogs, error: logsError } = await supabase
    .from("send_logs")
    .select("id, company_name, to_email, subject, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200); // 統計計算用に多めに取得

  if (logsError) {
    console.error("[dashboard] send_logs fetch error:", logsError);
  }

  const logs: SendLog[] = allLogs ?? [];

  // -------------------------------------------------------
  // 統計計算
  // -------------------------------------------------------
  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth(); // 0-indexed

  // 今月のログ
  const thisMonthLogs = logs.filter((l) => {
    const d = new Date(l.created_at);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
  });

  const thisMonthCount = thisMonthLogs.length;

  // 送信成功率（全期間）
  const totalCount   = logs.length;
  const sentCount    = logs.filter((l) => l.status === "sent").length;
  const failedCount  = logs.filter((l) => l.status === "failed").length;
  const successRate  = totalCount > 0
    ? Math.round((sentCount / totalCount) * 100)
    : 0;

  // 最新5件
  const recentLogs = logs.slice(0, 5);

  // greeting
  const companyName = user.user_metadata?.company_name ?? null;
  const greeting    = companyName ?? "ようこそ";

  // -------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Stripe 決済完了バナー */}
      {params.checkout === "success" && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              サブスクリプションが有効になりました 🎉
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              ご登録ありがとうございます。すべての機能をご利用いただけます。
            </p>
          </div>
        </div>
      )}

      {/* ページヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-0.5">{greeting}</p>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            ダッシュボード
          </h1>
        </div>
        <Link href="/upload" className="btn-primary">
          <Plus size={16} />
          新しい請求書を送る
        </Link>
      </div>

      {/* ===== 統計カード ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 今月の送信数 — 実データ */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Send size={18} />
            </div>
            {thisMonthCount > 0 && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ↑
              </span>
            )}
          </div>
          <p className="font-display text-2xl font-bold text-slate-900">
            {thisMonthCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">今月の送信数</p>
          <p className="text-xs text-slate-400 mt-1">
            {thisMonthCount === 0 ? "今月まだ送信なし" : `今月 ${thisMonthCount} 件送信`}
          </p>
        </div>

        {/* 送信成功率 — 実データ */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
            {successRate >= 90 && totalCount > 0 && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ↑
              </span>
            )}
          </div>
          <p className="font-display text-2xl font-bold text-slate-900">
            {totalCount > 0 ? `${successRate}%` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">送信成功率</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalCount > 0
              ? `${sentCount} / ${totalCount} 件成功`
              : "送信履歴なし"}
          </p>
        </div>

        {/* 送信失敗数 — 実データ */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              failedCount > 0 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"
            }`}>
              <AlertCircle size={18} />
            </div>
            {failedCount > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                要確認
              </span>
            )}
          </div>
          <p className={`font-display text-2xl font-bold ${
            failedCount > 0 ? "text-red-600" : "text-slate-900"
          }`}>
            {failedCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">送信失敗数</p>
          <p className="text-xs text-slate-400 mt-1">
            {failedCount > 0 ? "送信ログを確認してください" : "失敗なし"}
          </p>
        </div>

        {/* 累計送信数 — 実データ */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-slate-900">
            {totalCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">累計送信数</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalCount > 0 ? "利用開始からの総送信" : "送信履歴なし"}
          </p>
        </div>
      </div>

      {/* ===== クイックアクション ===== */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/upload"
            className="group flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
              <FileSpreadsheet size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Excelをアップロード</p>
              <p className="text-xs text-slate-400">PDF変換して送信</p>
            </div>
          </Link>

          <button className="group flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 transition">
              <Users size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">顧客を追加</p>
              <p className="text-xs text-slate-400">新規顧客を登録</p>
            </div>
          </button>

          <Link
            href="/logs"
            className="group flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition">
              <ClipboardList size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">送信ログを確認</p>
              <p className="text-xs text-slate-400">全履歴を一覧表示</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ===== 最近の送信履歴 ===== */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">最近の送信履歴</h2>
          </div>
          <Link
            href="/logs"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition"
          >
            すべて表示
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <RecentLogsEmpty />
        ) : (
          <div className="divide-y divide-slate-50">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* ステータスアイコン */}
                <div className="flex-shrink-0">
                  {log.status === "sent" ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>

                {/* 送信情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {log.company_name}
                    </span>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {log.status === "sent" ? "送信完了" : "送信失敗"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {log.subject}
                  </p>
                </div>

                {/* 送信先・日時 */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-slate-500 truncate max-w-[140px]">
                    {log.to_email}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
