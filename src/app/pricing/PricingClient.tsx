"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Zap,
  Building2,
  Rocket,
  AlertCircle,
} from "lucide-react";

// -------------------------------------------------------
// プラン定義
// -------------------------------------------------------
interface Plan {
  id:          "starter" | "standard" | "business";
  name:        string;
  price:       string;          // 表示用
  priceNote:   string;          // "/月" など
  description: string;
  icon:        React.ElementType;
  color:       string;          // Tailwind bg クラス（アイコン背景）
  iconColor:   string;
  badge?:      string;          // "人気" など
  features:    string[];
  priceIdEnv:  string;          // window.__ENV__ からは使わず props で受け取る
}

const plans: Plan[] = [
  {
    id:          "starter",
    name:        "Starterプラン",
    price:       "¥980",
    priceNote:   "/ 月（税込）",
    description: "個人・フリーランス向け",
    icon:        Zap,
    color:       "bg-slate-100",
    iconColor:   "text-slate-500",
    features: [
      "月10件まで送信",
      "PDF変換",
      "送信ログ",
      "顧客管理（10件）",
    ],
    priceIdEnv: "STRIPE_PRICE_ID_STARTER",
  },
  {
    id:          "standard",
    name:        "Standardプラン",
    price:       "¥2,980",
    priceNote:   "/ 月（税込）",
    description: "中小企業・チーム向け",
    icon:        Building2,
    color:       "bg-blue-600",
    iconColor:   "text-white",
    badge:       "人気",
    features: [
      "月50件まで送信",
      "PDF変換",
      "送信ログ・再送機能",
      "顧客管理（無制限）",
      "CSVインポート",
      "メールテンプレート",
    ],
    priceIdEnv: "STRIPE_PRICE_ID_STANDRD",
  },
  {
    id:          "business",
    name:        "Businessプラン",
    price:       "¥7,980",
    priceNote:   "/ 月（税込）",
    description: "大量送信・複数担当者向け",
    icon:        Rocket,
    color:       "bg-violet-100",
    iconColor:   "text-violet-600",
    features: [
      "月送信無制限",
      "PDF変換",
      "送信ログ・再送機能",
      "顧客管理（無制限）",
      "CSVインポート",
      "メールテンプレート",
      "優先サポート",
    ],
    priceIdEnv: "STRIPE_PRICE_ID_BUSINESS",
  },
];

// -------------------------------------------------------
// Props
// -------------------------------------------------------
interface PricingClientProps {
  priceIdStarter:  string;
  priceIdStandard: string;
  priceIdBusiness: string;
  checkoutStatus?: string | null; // "success" | "cancelled"
}

// -------------------------------------------------------
// メインコンポーネント
// -------------------------------------------------------
export default function PricingClient({
  priceIdStarter,
  priceIdStandard,
  priceIdBusiness,
  checkoutStatus,
}: PricingClientProps) {
  const router = useRouter();
  const [loading,      setLoading]      = useState<string | null>(null); // planId
  const [globalError,  setGlobalError]  = useState<string | null>(null);

  // プランID → price_id マッピング
  const priceIdMap: Record<string, string> = {
    starter:  priceIdStarter,
    standard: priceIdStandard,
    business: priceIdBusiness,
  };

  // -------------------------------------------------------
  // Checkout 開始
  // -------------------------------------------------------
  const handleSubscribe = async (planId: string) => {
    const priceId = priceIdMap[planId];
    if (!priceId) {
      setGlobalError("このプランは現在準備中です。しばらくお待ちください。");
      return;
    }

    setLoading(planId);
    setGlobalError(null);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 未ログイン → ログイン画面へ
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        throw new Error(data.error || "決済セッションの作成に失敗しました");
      }

      // Stripe Checkout にリダイレクト
      window.location.href = data.url;
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "エラーが発生しました。もう一度お試しください。"
      );
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ── キャンセル通知 ── */}
        {checkoutStatus === "cancelled" && (
          <div className="mb-8 flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 max-w-xl mx-auto">
            <AlertCircle size={16} className="flex-shrink-0 text-amber-500" />
            お支払いがキャンセルされました。いつでも再度お試しいただけます。
          </div>
        )}

        {/* ── ページヘッダー ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h8v2H2V3zm0 4h12v2H2V7zm0 4h6v2H2v-2z" fill="white"/>
              </svg>
            </div>
            <span className="font-display text-sm font-bold text-slate-700">ExcelCend</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">
            プランを選択
          </h1>
          <p className="text-slate-500 text-sm">
            すべてのプランに14日間の無料トライアルが付いています。<br />
            クレジットカードはトライアル終了後に請求されます。
          </p>
        </div>

        {/* ── グローバルエラー ── */}
        {globalError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 max-w-xl mx-auto">
            <AlertCircle size={15} className="flex-shrink-0 text-red-400" />
            {globalError}
          </div>
        )}

        {/* ── プランカード ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon       = plan.icon;
            const isStandard = plan.id === "standard";
            const isLoading  = loading === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-6 flex flex-col transition-shadow hover:shadow-lg ${
                  isStandard
                    ? "border-blue-500 shadow-[0_0_0_2px_#3b82f6]"
                    : "border-slate-200 shadow-card"
                }`}
              >
                {/* 人気バッジ */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* アイコン & プラン名 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.color}`}>
                    <Icon size={20} className={plan.iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-slate-400">{plan.description}</p>
                  </div>
                </div>

                {/* 価格 */}
                <div className="mb-5 pb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-400">{plan.priceNote}</span>
                  </div>
                </div>

                {/* 機能リスト */}
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check
                        size={15}
                        className={`flex-shrink-0 mt-0.5 ${
                          isStandard ? "text-blue-500" : "text-emerald-500"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTAボタン */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!!loading}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                    isStandard
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 size={15} className="animate-spin" />処理中...</>
                  ) : (
                    "このプランを選択"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── 補足 ── */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-xs text-slate-400">
            お支払いは Stripe により安全に処理されます。いつでもキャンセル可能です。
          </p>
          <p className="text-xs text-slate-400">
            ご不明な点は <span className="text-blue-600">support@excelcend.jp</span> までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
