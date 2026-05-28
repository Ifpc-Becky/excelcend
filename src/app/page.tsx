"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, Upload, Mail, History, FileText, Paperclip, Users, PenSquare } from "lucide-react";

const planCards = [
  {
    name: "Free",
    price: "0円/月",
    sub: "月10通まで",
    features: ["Excel→PDF変換", "メール送信", "顧客管理（5件まで）", "送信ログ（30日）"],
    limits: ["再送なし", "CSV取込なし", "メールテンプレなし"],
    support: "メールのみ（5営業日以内）",
    cta: "登録して始める（10通まで無料）",
    href: "/auth/signup",
  },
  {
    name: "Starter",
    price: "390円/月",
    sub: "月30通まで",
    features: ["Excel→PDF変換", "メール送信", "顧客管理（50件まで）", "送信ログ（90日）"],
    limits: ["再送なし", "CSV取込なし", "メールテンプレなし"],
    support: "メールのみ（5営業日以内）",
    cta: "このプランで始める",
    href: "/pricing",
  },
  {
    name: "Standard",
    badge: "おすすめ",
    price: "980円/月",
    sub: "月100通まで",
    features: ["Excel→PDF変換", "メール送信", "再送機能", "CSV取込", "顧客管理（無制限）", "メールテンプレ", "送信ログ（無制限）"],
    support: "優先メール対応（2営業日以内）",
    cta: "このプランで始める",
    href: "/pricing",
  },
  {
    name: "Business",
    price: "2,980円/月",
    sub: "送信数無制限",
    features: ["Excel→PDF変換", "メール送信（無制限）", "送信ログ閲覧（無制限）", "再送", "顧客管理（無制限）", "CSV取込", "メールテンプレ"],
    support: "優先メールサポート（2営業日以内）＋Zoomサポート",
    cta: "このプランで始める",
    href: "/pricing",
  },
];

export default function Home() {
  const [copied, setCopied] = useState<string | null>(null);
  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <main className="bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600"><FileSpreadsheet size={16} className="text-white" /></div>
            <span className="text-base font-bold tracking-tight">ExcelCend</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">料金プラン</Link>
            <Link href="/auth/login" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">ログイン</Link>
            <Link href="/auth/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">登録して始める（10通まで無料）</Link>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-7 shadow-sm sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-blue-700">＼ Excelの請求書を送る、すべての中小企業・個人事業主の方へ ／</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Excelの請求書、<br />まだPDFにして送っていますか？</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">Excelはそのまま。<br />アップロードするだけで、請求書をかんたん送信。</p>
              <ul className="mt-6 grid gap-2 text-sm font-medium text-slate-700 sm:grid-cols-2">
                {["Excelをそのまま使える", "PDF化＋メール送信", "送信ログで履歴管理", "再送もワンクリック（Standard以上）"].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600" />{item}</li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signup" className="rounded-xl bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700">登録して始める（10通まで無料）</Link>
                <Link href="/pricing" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">料金プランを見る</Link>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto w-full max-w-[760px] rounded-[1.8rem] border border-slate-300 bg-slate-900 p-2.5 shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white">
                  <div className="flex h-9 items-center border-b border-slate-200 bg-slate-50 px-4">
                    <div className="h-2 w-2 rounded-full bg-slate-300" /><div className="ml-2 h-2 w-2 rounded-full bg-slate-300" /><div className="ml-2 h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="grid min-h-[390px] grid-cols-[190px_1fr]">
                    <aside className="border-r border-slate-100 bg-white p-3.5">
                      <p className="mb-2 text-sm font-bold text-slate-800">ExcelCend</p>
                      <div className="space-y-1.5 text-xs">
                        {['ダッシュボード','送信一覧','顧客管理','テンプレート','設定'].map((n,i)=><div key={n} className={`rounded-md px-2.5 py-1.5 ${i===0?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-50'}`}>{n}</div>)}
                      </div>
                    </aside>
                    <div className="bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">ダッシュボード</h3>
                        <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">+ 新しい請求書を送る</button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4 text-[11px]">
                        {[['今月の送信数','10 / 10','10 / 10 通'],['送信成功率','100 %','19 / 19 件成功'],['送信失敗数','0','失敗なし'],['累計送信数','19','利用開始からの総送信']].map((c)=>
                          <div key={c[0]} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><p className="text-slate-500">{c[0]}</p><p className="mt-1 text-xl font-bold text-slate-900">{c[1]}</p><p className="mt-0.5 text-slate-400">{c[2]}</p></div>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-800">クイックアクション</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3 text-[11px]">
                          {[["Excelをアップロード","PDF変換して送信"],["顧客を追加","新規顧客を登録"],["送信ログを確認","全履歴を一覧表示"]].map((a)=><div key={a[0]} className="rounded-lg border border-blue-100 bg-blue-50/40 p-2.5"><p className="font-semibold text-slate-800">{a[0]}</p><p className="text-slate-500">{a[1]}</p></div>)}
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-slate-800">最近の送信履歴</p><p className="text-[11px] text-blue-600">すべて表示</p></div>
                        <div className="space-y-1.5 text-[11px]">
                          {[
                            ['株式会社サンプル商事','accounting@sample.example.jp','05/26 15:12'],
                            ['東京設備株式会社','invoice@tokyosetsubi.example.jp','05/26 15:06'],
                            ['山田建設株式会社','office@yamada-kensetsu.example.jp','05/26 15:05'],
                            ['ABCオフィスサービス株式会社','billing@abc-office.example.jp','05/26 14:58'],
                            ['株式会社みらい工業','info@mirai-kogyo.example.jp','05/26 14:50'],
                          ].map((row)=><div key={row[1]} className="grid grid-cols-[1.4fr_1.3fr_auto] items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5"><span className="truncate text-slate-700">{row[0]}</span><span className="truncate text-slate-500">{row[1]}</span><span className="text-slate-400">{row[2]}</span></div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-1 h-2.5 w-[90%] rounded-b-full bg-slate-300/70" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 shadow-sm sm:px-6">
          <h2 className="text-lg font-bold text-amber-900">🎉 先着100社限定｜創業ユーザー特典</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[{ n: "Standard", p: "980円 → 690円/月", c: "EARLY100SD" }, { n: "Business", p: "2,980円 → 1,980円/月", c: "EARLY100BIZ" }].map((v) => (
              <div key={v.c} className="rounded-xl border border-amber-300 bg-white p-4">
                <p className="text-sm font-semibold">{v.n}</p><p className="mt-1 text-xl font-bold text-rose-700">{v.p}</p>
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-amber-100 px-3 py-2"><code className="text-sm font-bold">{v.c}</code><button type="button" onClick={() => handleCopy(v.c)} className="rounded-md border border-amber-400 bg-white px-2 py-1 text-xs font-semibold">{copied === v.c ? "コピー済み" : "コピー"}</button></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">※先着100社限定 / ※100社到達後は通常価格 / ※決済時にコード入力で適用</p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">こんなお悩み、ありませんか？</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { title: "PDF変換が面倒", desc: "Excel請求書を毎回PDF化するのが手間", icon: FileText },
                { title: "添付漏れが不安", desc: "メール送信時の添付忘れや送信ミスが心配", icon: Paperclip },
                { title: "誰に送ったかわからない", desc: "送信先や送信履歴の管理が面倒", icon: Users },
                { title: "毎回メール作成が手間", desc: "件名や本文を毎回入力するのが大変", icon: PenSquare },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="mb-2 inline-flex rounded-lg border border-blue-200 bg-blue-50 p-2">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-emerald-700">ExcelCendなら、送信がもっとシンプルに！</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { title: "ExcelのままでOK", desc: "今ある請求書フォーマットを変更不要", icon: FileSpreadsheet },
                { title: "アップロード", desc: "ドラッグ＆ドロップですぐ完了", icon: Upload },
                { title: "メール送信", desc: "請求書をそのまま送信", icon: Mail },
                { title: "履歴保存", desc: "誰に送ったかすぐ確認", icon: History },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="mb-2 inline-flex rounded-lg border border-blue-200 bg-blue-50 p-2">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-center text-3xl font-bold">あなたに合ったプランが見つかる、シンプルな料金体系</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            {planCards.map((p) => (
              <article key={p.name} className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm ${p.name === "Standard" ? "border-blue-500 ring-2 ring-blue-500" : p.name === "Business" ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"}`}>
                {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">{p.badge}</span>}
                <h3 className="text-xl font-bold text-blue-900">{p.name}</h3>
                <p className="mt-1 text-3xl font-bold">{p.price}</p>
                <p className="text-sm text-slate-600">{p.sub}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
                {p.limits && <ul className="mt-2 space-y-1 text-sm text-slate-500">{p.limits.map((l) => <li key={l}>× {l}</li>)}</ul>}
                <div className="mt-auto">
                  <p className="mt-3 text-xs text-slate-600">サポート：{p.support}</p>
                  <Link href={p.href} className={`mt-4 block rounded-lg px-4 py-2 text-center text-sm font-semibold transition-all duration-200 ${p.name === "Standard" ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm hover:text-amber-200" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`}>{p.cta}</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-center text-3xl font-bold">ExcelCendが選ばれる理由</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold">ExcelのままでOK</p><p className="mt-2 text-slate-600">今ある請求書フォーマットを変える必要なし</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold">送信がかんたん</p><p className="mt-2 text-slate-600">アップロードするだけ</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold">履歴を自動保存</p><p className="mt-2 text-slate-600">誰にいつ送ったか確認できる</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold">安心のセキュリティ</p><p className="mt-2 text-slate-600">通信は安全に管理</p></div>
          </div>
          <p className="mt-5 text-center text-slate-700">税理士にもおすすめ / 中小企業・個人事業主向け</p>
        </section>

        <section className="my-12 rounded-3xl border border-blue-200 bg-blue-600 px-6 py-10 text-center text-white">
          <h2 className="text-3xl font-bold">まずは無料でお試しください</h2>
          <p className="mt-2">月10通まで0円で利用できます</p>
          <Link href="/auth/signup" className="mt-5 inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700">登録して始める（10通まで無料）</Link>
          <p className="mt-3 text-xs text-blue-100">クレジットカード登録不要・登録30秒</p>
        </section>
      </div>
    </main>
  );
}
