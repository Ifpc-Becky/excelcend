import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";

const painPoints = [
  "ExcelからPDFにする作業が毎回手間",
  "メール添付・本文作成・送信確認が煩雑",
  "送信履歴や再送管理が分散して追いづらい",
];

const features = [
  "ExcelからPDF変換",
  "請求書メール送信",
  "送信ログ",
  "再送",
  "顧客管理",
  "メールテンプレート",
  "CSVインポート",
];

const faqs = [
  {
    q: "Excelファイル形式は？",
    a: "一般的な .xlsx 形式に対応しています。テンプレートの事前確認も可能です。",
  },
  {
    q: "無料で試せますか？",
    a: "はい。まずは無料でお試しいただけます。",
  },
  {
    q: "支払い方法は？",
    a: "主要なクレジットカード決済に対応しています。詳細は料金ページをご確認ください。",
  },
  {
    q: "請求書以外も送れますか？",
    a: "帳票フォーマット次第で運用可能です。まずは請求書用途でのご利用を推奨しています。",
  },
  {
    q: "サポートはありますか？",
    a: "はい。プランに応じてサポートをご用意しています。",
  },
];

const plans = [
  { name: "Starter", summary: "個人事業主向けの小規模運用に" },
  { name: "Standard", summary: "中小企業の定常業務を効率化" },
  { name: "Business", summary: "送信量が多い事業者向け" },
];

export default function Home() {
  return (
    <main className="bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={16} className="text-white" />
            </div>
            <span className="font-display text-base font-bold text-slate-900 tracking-tight">ExcelCend</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              料金
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              新規登録
            </Link>
          </div>
        </header>

        <section className="mt-10 rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-8 sm:p-12">
          <p className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            リリース直後の先行利用受付中
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Excel請求書のPDF化・送信をもっとシンプルに。
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Excelファイルをアップロードするだけで、PDF変換からメール送信まで一括で完了できます。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/upload" className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700">
              無料で試す
            </Link>
            <Link href="/pricing" className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              料金を見る
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">こんな課題はありませんか？</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {painPoints.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">ExcelCendなら3ステップで完了</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["アップロード", "PDF変換", "メール送信"].map((step, i) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold text-blue-700">STEP {i + 1}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">主な機能</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-blue-100 bg-blue-50/40 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">料金プラン</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
                <p className="mt-2 text-sm text-slate-600">{plan.summary}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/pricing" className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              料金プランを見る
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-900">{faq.q}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-14 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-bold">まずは1通、無料でお試しください</h2>
          <p className="mt-3 text-sm text-slate-300">アップロードから送信まで、数分で体験できます。</p>
          <div className="mt-6">
            <Link href="/upload" className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              請求書をアップロードする
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
