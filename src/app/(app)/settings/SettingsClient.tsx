"use client";

import { useState } from "react";
import {
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Building2,
  CreditCard,
  LifeBuoy,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface MailTemplate {
  id: string | null;
  template_name: string;
  subject_template: string | null;
  body_template: string;
  updated_at: string | null;
}

export interface AccountProfile {
  companyName: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
}

export default function SettingsClient({
  initialTemplate,
  currentPlan,
  initialProfile,
}: {
  initialTemplate: MailTemplate;
  currentPlan: string;
  initialProfile: AccountProfile;
}) {
  const supabase = createClient();

  const [subjectTpl, setSubjectTpl] = useState(initialTemplate.subject_template ?? "");
  const [bodyTpl, setBodyTpl] = useState(initialTemplate.body_template);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profile, setProfile] = useState<AccountProfile>(initialProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const lastSaved = initialTemplate.updated_at
    ? new Date(initialTemplate.updated_at).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
          templateName: "default",
          subjectTemplate: subjectTpl.trim(),
          bodyTemplate: bodyTpl.trim(),
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

  const saveCompanyProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);
    const { error } = await supabase.auth.updateUser({
      data: {
        company_name: profile.companyName.trim(),
        postal_code: profile.postalCode.trim(),
        address: profile.address.trim(),
        phone_number: profile.phoneNumber.trim(),
      },
    });

    if (error) {
      setProfileError(error.message);
    } else {
      setProfileMessage("会社情報を保存しました。");
    }
    setSavingProfile(false);
  };

  const changePassword = async () => {
    if (password.length < 8) {
      setPasswordError("パスワードは8文字以上で入力してください。");
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordMessage("パスワードを変更しました。");
      setPassword("");
    }
    setSavingPassword(false);
  };

  const openCustomerPortal = async () => {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const res = await fetch("/api/create-customer-portal-session", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "ポータルを開けませんでした");
      window.location.href = data.url;
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : "エラーが発生しました");
      setBillingLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-0.5">アカウントと各種設定を管理します</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <Building2 size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">アカウント</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800">会社情報編集</h3>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field" placeholder="会社名" value={profile.companyName} onChange={(e)=>setProfile({...profile, companyName:e.target.value})} />
              <input className="input-field" placeholder="郵便番号" value={profile.postalCode} onChange={(e)=>setProfile({...profile, postalCode:e.target.value})} />
              <input className="input-field md:col-span-2" placeholder="住所" value={profile.address} onChange={(e)=>setProfile({...profile, address:e.target.value})} />
              <input className="input-field" placeholder="電話番号" value={profile.phoneNumber} onChange={(e)=>setProfile({...profile, phoneNumber:e.target.value})} />
            </div>
            {profileError && <p className="text-xs text-red-500 mt-2">{profileError}</p>}
            {profileMessage && <p className="text-xs text-emerald-600 mt-2">{profileMessage}</p>}
            <div className="flex justify-end mt-3"><button onClick={saveCompanyProfile} disabled={savingProfile} className="btn-primary">{savingProfile ? <><Loader2 size={14} className="animate-spin" />保存中...</> : <><Save size={14} />保存</>}</button></div>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">メールアドレス変更</h3>
            <p className="text-xs text-slate-500">メールアドレス変更をご希望の場合は support@excelcend.com までご連絡ください</p>
          </div>

          <div className="pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">パスワード変更</h3>
            <div className="space-y-2">
              <input type="password" className="input-field" placeholder="新しいパスワード（8文字以上）" value={password} onChange={(e)=>setPassword(e.target.value)} />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              {passwordMessage && <p className="text-xs text-emerald-600">{passwordMessage}</p>}
              <div className="flex justify-end">
                <button onClick={changePassword} disabled={savingPassword} className="btn-primary">{savingPassword ? <><Loader2 size={14} className="animate-spin" />変更中...</> : <><Save size={14} />保存</>}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <CreditCard size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">プランと請求</h2>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-500">現在のプラン: <span className="font-semibold text-slate-700">{currentPlan}</span></p>
          <div className="flex flex-wrap gap-2">
            <a href="/pricing" className="btn-primary"><ExternalLink size={14} />プランをアップグレード</a>
            <button onClick={openCustomerPortal} disabled={billingLoading} className="btn-secondary">{billingLoading ? <><Loader2 size={14} className="animate-spin" />移動中...</> : "支払い方法を変更"}</button>
          </div>
        </div>
        {billingError && <p className="text-xs text-red-500">{billingError}</p>}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <Mail size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">メールテンプレート</h2>
          </div>
          {lastSaved && <span className="text-xs text-slate-400">最終保存: {lastSaved}</span>}
        </div>
        <div className="p-6 space-y-5">{/* existing template UI */}
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3"><FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-blue-700 leading-relaxed"><span className="font-semibold">{"{companyName}"}</span> と記述すると、送信時に送信元会社名に自動置換されます。</p></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">件名テンプレート</label><input type="text" value={subjectTpl} onChange={(e) => { setSubjectTpl(e.target.value); setSaveError(null); }} placeholder="{companyName}より請求書を送付いたしました" className="input-field" disabled={saving} /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">本文テンプレート<span className="text-red-400 ml-0.5">*</span></label><textarea value={bodyTpl} onChange={(e) => { setBodyTpl(e.target.value); setSaveError(null); }} rows={8} className="input-field resize-y leading-relaxed" disabled={saving} /></div>
          {saveError && <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600"><AlertCircle size={13} className="flex-shrink-0 text-red-400" />{saveError}</div>}
          {saveSuccess && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-xs text-emerald-700"><CheckCircle2 size={13} className="flex-shrink-0 text-emerald-500" />テンプレートを保存しました</div>}
          <div className="flex justify-end pt-1 border-t border-slate-100"><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? <><Loader2 size={14} className="animate-spin" />保存中...</> : <><Save size={14} />テンプレートを保存</>}</button></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <LifeBuoy size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">サポート</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600">アカウント削除をご希望の場合は support@excelcend.com までお問い合わせください。</p>
        </div>
      </div>
    </div>
  );
}
