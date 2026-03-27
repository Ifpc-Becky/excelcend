"use client";

import { useState } from "react";
import {
  Building2,
  Mail,
  Bell,
  Shield,
  CreditCard,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
export interface MailTemplate {
  id: string | null;
  template_name: string;
  subject_template: string | null;
  body_template: string;
  updated_at: string | null;
}

// -------------------------------------------------------
// 静的設定セクション（ダミー項目）
// -------------------------------------------------------
const staticSections = [
  {
    title: "アカウント",
    icon: Building2,
    items: [
      { label: "会社情報", desc: "会社名・住所・電話番号" },
      { label: "メールアドレス変更", desc: "ログイン用メールを変更" },
      { label: "パスワード変更", desc: "パスワードを更新" },
    ],
  },
  {
    title: "通知",
    icon: Bell,
    items: [
      { label: "送信完了通知", desc: "送信成功時にメールで通知" },
      { label: "送信失敗アラート", desc: "失敗時にリアルタイム通知" },
    ],
  },
  {
    title: "プランと請求",
    icon: CreditCard,
    items: [
      { label: "現在のプラン", desc: "Standardプラン（¥2,980/月）" },
      { label: "プランをアップグレード", desc: "送信数・機能を拡張" },
      { label: "支払い方法", desc: "クレジットカード管理" },
    ],
  },
  {
    title: "セキュリティ",
    icon: Shield,
    items: [
      { label: "2段階認証", desc: "アカウントのセキュリティを強化" },
      { label: "ログイン履歴", desc: "最近のログインを確認" },
    ],
  },
];

// -------------------------------------------------------
// メインコンポーネント
// -------------------------------------------------------
export default function SettingsClient({
  initialTemplate,
}: {
  initialTemplate: MailTemplate;
}) {
  // テンプレート編集 state
  const [subjectTpl, setSubjectTpl] = useState(
    initialTemplate.subject_template ?? ""
  );
  const [bodyTpl,    setBodyTpl]    = useState(initialTemplate.body_template);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [saveSuccess,setSaveSuccess]= useState(false);

  // 最終保存日時
  const lastSaved = initialTemplate.updated_at
    ? new Date(initialTemplate.updated_at).toLocaleString("ja-JP", {
        year:   "numeric",
        month:  "2-digit",
        day:    "2-digit",
        hour:   "2-digit",
        minute: "2-digit",
      })
    : null;

  // -------------------------------------------------------
  // 保存処理
  // -------------------------------------------------------
  const handleSave = async () => {
    if (!bodyTpl.trim()) {
      setSaveError("本文テンプレートは必須です");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/mail-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName:    "default",
          subjectTemplate: subjectTpl.trim(),
          bodyTemplate:    bodyTpl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-0.5">アカウントと各種設定を管理します</p>
      </div>

      {/* ===== メールテンプレート（実装済み） ===== */}
      <div className="card overflow-hidden">
        {/* セクションヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <Mail size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">メールテンプレート</h2>
          </div>
          {lastSaved && (
            <span className="text-xs text-slate-400">最終保存: {lastSaved}</span>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* ヒント */}
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3">
            <FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">{"{companyName}"}</span> と記述すると、送信時に送信元会社名に自動置換されます。
            </p>
          </div>

          {/* 件名テンプレート */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              件名テンプレート
            </label>
            <input
              type="text"
              value={subjectTpl}
              onChange={(e) => { setSubjectTpl(e.target.value); setSaveError(null); }}
              placeholder="{companyName}より請求書を送付いたしました"
              className="input-field"
              disabled={saving}
            />
            <p className="text-xs text-slate-400 mt-1">
              送信フォームの件名初期値として使われます
            </p>
          </div>

          {/* 本文テンプレート */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              本文テンプレート
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <textarea
              value={bodyTpl}
              onChange={(e) => { setBodyTpl(e.target.value); setSaveError(null); }}
              placeholder="{companyName}でございます。&#10;いつもお世話になっております。&#10;添付ファイルにて請求書をお送りいたします。&#10;ご確認のほどよろしくお願いいたします。"
              rows={8}
              className="input-field resize-y leading-relaxed"
              disabled={saving}
            />
            <p className="text-xs text-slate-400 mt-1">
              送信フォームの本文初期値として使われます。改行はそのまま反映されます。
            </p>
          </div>

          {/* プレビュー */}
          {(subjectTpl || bodyTpl) && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">プレビュー（{"{companyName}"} → 株式会社サンプル）</p>
              {subjectTpl && (
                <div className="mb-2">
                  <span className="text-xs text-slate-400">件名：</span>
                  <span className="text-xs text-slate-700 font-medium">
                    {subjectTpl.replace(/\{companyName\}/g, "株式会社サンプル")}
                  </span>
                </div>
              )}
              <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200 pt-2 mt-2">
                {bodyTpl.replace(/\{companyName\}/g, "株式会社サンプル")}
              </div>
            </div>
          )}

          {/* エラー */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
              <AlertCircle size={13} className="flex-shrink-0 text-red-400" />
              {saveError}
            </div>
          )}

          {/* 成功 */}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-xs text-emerald-700">
              <CheckCircle2 size={13} className="flex-shrink-0 text-emerald-500" />
              テンプレートを保存しました
            </div>
          )}

          {/* 保存ボタン */}
          <div className="flex justify-end pt-1 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" />保存中...</>
                : <><Save size={14} />テンプレートを保存</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ===== その他の設定（静的ダミーセクション） ===== */}
      {staticSections.map(({ title, icon: Icon, items }) => (
        <div key={title} className="card overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <Icon size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {items.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition text-left"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 危険ゾーン */}
      <div className="card p-5 border-red-100 bg-red-50/30">
        <h3 className="text-sm font-semibold text-red-700 mb-1">危険ゾーン</h3>
        <p className="text-xs text-red-500 mb-3">
          アカウントを削除すると、すべてのデータが完全に失われます。
        </p>
        <button className="text-xs font-medium text-red-600 hover:text-red-700 underline">
          アカウントを削除する
        </button>
      </div>
    </div>
  );
}
