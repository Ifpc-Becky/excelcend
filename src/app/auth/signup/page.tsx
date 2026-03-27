"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください。");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company_name: companyName },
      },
    });

    if (error) {
      setError("登録に失敗しました。しばらく経ってから再度お試しください。");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Supabaseのメール確認なしの場合は直接ダッシュボードへ
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
          登録が完了しました！
        </h2>
        <p className="text-sm text-slate-500">ダッシュボードへ移動中...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">
        新規登録
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        すでにアカウントをお持ちの方は
        <Link href="/auth/login" className="text-blue-600 font-medium hover:underline ml-1">
          ログイン
        </Link>
      </p>

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            会社名・屋号
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="株式会社〇〇"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            パスワード
            <span className="text-slate-400 font-normal ml-1">（8文字以上）</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "登録中..." : "無料で始める"}
        </button>

        <p className="text-xs text-center text-slate-400">
          登録することで
          <span className="text-slate-500">利用規約</span>・
          <span className="text-slate-500">プライバシーポリシー</span>
          に同意したことになります。
        </p>
      </form>
    </div>
  );
}
