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
  id:          "free" | "starter" | "standard" | "business";
  name:        string;
  price:       string;          // 表示用
  priceNote:   string;          // "/月" など
  description: string;
  icon:        React.ElementType;
  color:       string;          // Tailwind bg クラス（アイコン背景）
  iconColor:   string;
  badge?:      string;          // "人気" など
  features:    string[];
  ctaLabel:    string;
}

const plans: Plan[] = [
  {
    id:          "free",
    name:        "Freeプラン",
    price:       "¥0",
    priceNote:   "/ 月",
    description: "まずは無料でお試し",
    icon:        Zap,
    color:       "bg-slate-100",
    iconColor:   "text-slate-500",
    features: [
      "月10通まで送信",
      "Excel→PDF変換",
      "メール送信",
      "送信ログ（30日）",
      "顧客管理（5件まで）",
      "再送なし",
      "CSV取込なし",
      "メールテンプレなし",
      "クーポン利用不可",
      "メールサポート（5営業日以内）",
    ],
    ctaLabel:    "無料で試す",
  },
  {
    id:          "starter",
    name:        "Starterプラン",
    price:       "¥390",
    priceNote:   "/ 月",
    description: "個人・フリーランス向け",
    icon:        Zap,
    color:       "bg-slate-100",
    iconColor:   "text-slate-500",
    features: [
      "月30通まで送信",
      "Excel→PDF変換",
      "メール送信",
      "送信ログ（90日）",
      "顧客管理（50件まで）",
      "再送なし",
      "CSV取込なし",
      "メールテンプレなし",
      "クーポン利用不可",
      "メールサポート（5営業日以内）",
    ],
    ctaLabel:    "このプランで始める",
  },
  {
    id:          "standard",
    name:        "Standardプラン",
    price:       "¥980",
    priceNote:   "/ 月",
    description: "中小企業・チーム向け",
    icon:        Building2,
    color:       "bg-blue-600",
    iconColor:   "text-white",
    badge:       "おすすめ",
    features: [
      "月100通まで送信",
      "Excel→PDF変換",
      "メール送信",
      "送信ログ（無制限）",
      "再送機能",
      "顧客管理（無制限）",
      "CSV取込",
      "メールテンプレ",
      "優先メールサポート（2営業日以内）",
    ],
    ctaLabel:    "このプランで始める",
  },
  {
    id:          "business",
    name:        "Businessプラン",
    price:       "¥2,980",
    priceNote:   "/ 月",
    description: "大量送信向け",
    icon:        Rocket,
    color:       "bg-violet-100",
    iconColor:   "text-violet-600",
    features: [
      "送信通数：無制限",
      "Excel→PDF変換",
      "メール送信",
      "送信ログ（無制限）",
      "再送機能",
      "顧客管理（無制限）",
      "CSV取込",
      "メールテンプレ",
      "優先メールサポート（2営業日以内）＋Zoomサポート",
    ],
    ctaLabel:    "このプランで始める",
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    if (planId === "free") {
      router.push("/auth/signup");
      return;
    }

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

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setGlobalError("クーポンコードのコピーに失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            トップへ戻る
          </button>
        </div>

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
            料金は月額制です。いつでも解約可能です。<br />
            お支払いはStripeにて安全に処理されます。
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-[#D4AF37] bg-[#FFF9E8] px-4 py-5 text-center shadow-[0_8px_26px_rgba(15,23,42,0.08)] md:px-7 md:py-6">
            <p className="text-sm font-semibold text-slate-800 md:text-base">
              ✨ 先着100社限定｜創業ユーザー特典
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { name: "Standardプラン", code: "EARLY100SD", regular: "通常 ¥980", discounted: "¥690 / 月" },
                { name: "Businessプラン", code: "EARLY100BIZ", regular: "通常 ¥2,980", discounted: "¥1,980 / 月" },
              ].map((coupon) => (
                <div key={coupon.code} className="rounded-xl border border-[#D4AF37]/45 bg-white/70 px-3.5 py-4 text-left shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-semibold text-slate-600">{coupon.name}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(coupon.code)}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#D4AF37] bg-[#FFF3CC] px-3 py-1.5 text-xs font-bold text-[#7a5a00] transition-colors hover:bg-[#FFEAA8]"
                  >
                    <span>{coupon.code}</span>
                    <span className="text-[11px] font-medium text-[#8a6a0f]">
                      {copiedCode === coupon.code ? "コピー済み" : "コピー"}
                    </span>
                  </button>
                  <p className="mt-2 text-xs text-slate-500">{coupon.regular}</p>
                  <p className="text-base font-bold text-slate-900">{coupon.discounted}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p>※先着100社限定</p>
              <p>※100社到達後は通常価格</p>
              <p>※決済時にコード入力で適用</p>
            </div>
          </div>
        </div>

        {/* ── グローバルエラー ── */}
        {globalError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 max-w-xl mx-auto">
            <AlertCircle size={15} className="flex-shrink-0 text-red-400" />
            {globalError}
          </div>
        )}

        {/* ── プランカード ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                    plan.ctaLabel
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── 補足 ── */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-xs text-slate-400">
            料金は月額制です。いつでも解約可能です。
          </p>
          <p className="text-xs text-slate-400">
            ご不明な点は <span className="text-blue-600">support@excelcend.com</span> までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
