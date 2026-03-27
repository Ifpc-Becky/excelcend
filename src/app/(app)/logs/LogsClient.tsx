"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Download,
  ClipboardList,
  Plus,
  RefreshCw,
  Loader2,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
export interface SendLog {
  id: string;
  company_name: string;
  to_email: string;
  subject: string;
  pdf_path: string | null;
  source_file_path: string | null;
  status: string;
  created_at: string;
}

// -------------------------------------------------------
// ユーティリティ
// -------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

// -------------------------------------------------------
// トースト型
// -------------------------------------------------------
type ToastType = "success" | "error";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// -------------------------------------------------------
// トーストコンポーネント
// -------------------------------------------------------
function ToastList({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border pointer-events-auto
            ${t.type === "success"
              ? "bg-white border-emerald-200 text-emerald-700"
              : "bg-white border-red-200 text-red-600"
            }`}
        >
          {t.type === "success"
            ? <CheckCheck size={16} className="text-emerald-500 flex-shrink-0" />
            : <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          }
          {t.message}
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// 空状態
// -------------------------------------------------------
function EmptyState() {
  return (
    <div className="card p-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <ClipboardList size={28} className="text-slate-400" />
      </div>
      <h3 className="font-display text-base font-bold text-slate-700 mb-2">
        まだ送信履歴はありません
      </h3>
      <p className="text-sm text-slate-400 mb-7 leading-relaxed">
        請求書をアップロードして送信すると、<br />
        ここに履歴が表示されます。
      </p>
      <Link href="/upload" className="btn-primary">
        <Plus size={15} />
        請求書をアップロードして送信
      </Link>
    </div>
  );
}

// -------------------------------------------------------
// メインクライアントコンポーネント
// -------------------------------------------------------
export default function LogsClient({
  initialLogs,
}: {
  initialLogs: SendLog[];
}) {
  const [logs,    setLogs]    = useState<SendLog[]>(initialLogs);
  const [toasts,  setToasts]  = useState<Toast[]>([]);
  // { [logId]: true } — 再送実行中のID管理
  const [resending, setResending] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------
  // トースト表示（3秒で自動消去）
  // -------------------------------------------------------
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // -------------------------------------------------------
  // ログ一覧を再取得（再送成功後に呼ぶ）
  // -------------------------------------------------------
  const refreshLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      if (!res.ok) return;
      const data: SendLog[] = await res.json();
      setLogs(data);
    } catch {
      // 再取得失敗はサイレント（既存表示のまま）
    }
  }, []);

  // -------------------------------------------------------
  // 再送処理
  // -------------------------------------------------------
  const handleResend = useCallback(async (log: SendLog) => {
    if (resending[log.id]) return;

    setResending((prev) => ({ ...prev, [log.id]: true }));
    try {
      const res = await fetch("/api/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: log.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "再送に失敗しました");
      }

      showToast("success", `${log.to_email} へ再送しました`);
      // 新しいログが追加されるので一覧を更新
      await refreshLogs();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "再送に失敗しました"
      );
    } finally {
      setResending((prev) => {
        const next = { ...prev };
        delete next[log.id];
        return next;
      });
    }
  }, [resending, showToast, refreshLogs]);

  // -------------------------------------------------------
  // 統計
  // -------------------------------------------------------
  const sentCount   = logs.filter((l) => l.status === "sent").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  // -------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------
  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ページヘッダー */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">送信ログ</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              メール送信の履歴を確認・再送できます
            </p>
          </div>
          {logs.length > 0 && (
            <button className="btn-secondary" disabled title="準備中">
              <Download size={15} />
              CSVエクスポート
            </button>
          )}
        </div>

        {/* サマリーカード */}
        {logs.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">総送信数</p>
              <p className="font-display text-2xl font-bold text-slate-900">{logs.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">送信完了</p>
              <p className="font-display text-2xl font-bold text-emerald-600">{sentCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">送信失敗</p>
              <p className="font-display text-2xl font-bold text-red-500">{failedCount}</p>
            </div>
          </div>
        )}

        {/* ログ一覧 or 空状態 */}
        {logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 px-6 py-3 w-28">
                      ステータス
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                      送信元会社名 / 送信先
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">
                      件名
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">
                      送信日時
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3 w-20">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => {
                    const isResending = !!resending[log.id];
                    const canResend   = !!log.pdf_path;
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* ステータス */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {log.status === "sent" ? (
                              <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                              <XCircle size={15} className="text-red-400 flex-shrink-0" />
                            )}
                            <span className={`text-xs font-medium ${
                              log.status === "sent" ? "text-emerald-700" : "text-red-600"
                            }`}>
                              {log.status === "sent" ? "送信完了" : "送信失敗"}
                            </span>
                          </div>
                        </td>

                        {/* 送信元 / 送信先 */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
                            {log.company_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">
                            → {log.to_email}
                          </p>
                        </td>

                        {/* 件名 */}
                        <td className="px-4 py-4 hidden md:table-cell max-w-xs">
                          <p className="text-sm text-slate-600 truncate">{log.subject}</p>
                        </td>

                        {/* 送信日時 */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-500">
                            {formatDate(log.created_at)}
                          </span>
                        </td>

                        {/* 再送ボタン */}
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleResend(log)}
                            disabled={isResending || !canResend}
                            title={
                              !canResend
                                ? "PDFが紐付いていないため再送できません"
                                : "このメールを再送する"
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                              ${isResending
                                ? "bg-blue-50 text-blue-400 cursor-not-allowed"
                                : !canResend
                                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                              }`}
                          >
                            {isResending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                            {isResending ? "送信中" : "再送"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* フッター */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">全 {logs.length} 件</span>
              <Link
                href="/upload"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
              >
                <Plus size={13} />
                新しい請求書を送る
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* トースト */}
      <ToastList toasts={toasts} />
    </>
  );
}
