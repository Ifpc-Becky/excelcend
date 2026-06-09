import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | ExcelCend",
  description: "ExcelCend の特定商取引法に基づく表記ページです。",
};

const businessInfo = [
  {
    label: "販売事業者",
    content: <p>株式会社イフペック</p>,
  },
  {
    label: "運営責任者",
    content: <p>ムオンベキ ゆきこ</p>,
  },
  {
    label: "所在地",
    content: (
      <p>
        〒106-0032<br />
        東京都港区六本木6-6-13 スプリームマンション302
      </p>
    ),
  },
  {
    label: "お問い合わせ先",
    content: (
      <div className="space-y-3">
        <p>メールアドレス：support@excelcend.com</p>
        <p className="text-sm text-slate-500">
          ※お問い合わせは原則メールにて受け付けております。<br />
          ※営業・勧誘目的のお問い合わせはご遠慮ください。
        </p>
      </div>
    ),
  },
  {
    label: "サービス名",
    content: <p>ExcelCend（エクセルセンド）</p>,
  },
  {
    label: "サービス内容",
    content: (
      <p>
        Excel形式の請求書ファイルをアップロードし、PDF変換および請求書メール送信、
        送信履歴管理等を行うクラウドサービス（SaaS）の提供。
      </p>
    ),
  },
  {
    label: "販売価格",
    content: (
      <div className="space-y-4">
        <p>各プランの料金は以下の通りです。</p>
        <ul className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          <li>Freeプラン：0円（月10通まで）</li>
          <li>Starterプラン：390円（税込/月・30通まで）</li>
          <li>Standardプラン：980円（税込/月・100通まで）</li>
          <li>Businessプラン：2,980円（税込/月・無制限）</li>
        </ul>
        <p>最新の料金については料金ページをご確認ください。</p>
      </div>
    ),
  },
  {
    label: "商品代金以外の必要料金",
    content: <p>インターネット接続に必要な通信料金等は、お客様のご負担となります。</p>,
  },
  {
    label: "お支払い方法",
    content: <p>クレジットカード決済</p>,
  },
  {
    label: "お支払い時期",
    content: <p>有料プランは申込時に課金され、以降は契約更新日に自動更新されます。</p>,
  },
  {
    label: "サービス提供時期",
    content: <p>登録完了後、直ちにご利用いただけます。</p>,
  },
  {
    label: "解約について",
    content: (
      <div className="space-y-3">
        <p>有料プランはいつでも解約可能です。</p>
        <p>解約後は次回更新日以降の請求は発生しません。</p>
        <p>
          契約期間途中で解約された場合でも、既に支払済み料金の日割り返金・月割り返金は行いません。
        </p>
      </div>
    ),
  },
  {
    label: "返品・返金について",
    content: (
      <div className="space-y-3">
        <p>本サービスの性質上、購入後の返品・返金には原則対応しておりません。</p>
        <p>ただし、当社側の重大なシステム障害等、当社に責任がある場合を除きます。</p>
      </div>
    ),
  },
  {
    label: "動作環境",
    content: <p>Google Chrome、Microsoft Edge、Safari等の主要ブラウザの最新版推奨。</p>,
  },
  {
    label: "表現およびサービスに関する注意書き",
    content: (
      <div className="space-y-3">
        <p>
          本サービスは、利用環境・通信状況等により一部機能が正常に利用できない場合があります。
        </p>
        <p>
          当社は、本サービスの継続的改善・保守等の目的で、機能変更・一時停止を行う場合があります。
        </p>
      </div>
    ),
  },
  {
    label: "制定日",
    content: <p>2026年6月1日</p>,
  },
];

export default function TokushohoPage() {
  return (
    <LegalPage title="特定商取引法に基づく表記" description="ExcelCend の特定商取引法に基づく表記です。">
      <div className="not-prose overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-200">
          {businessInfo.map((item) => (
            <div
              key={item.label}
              className="grid gap-3 px-4 py-5 sm:grid-cols-[180px_1fr] sm:gap-8 sm:px-6 sm:py-6"
            >
              <dt className="text-sm font-semibold leading-6 tracking-wide text-slate-900">
                {item.label}
              </dt>
              <dd className="min-w-0 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8 [&_p]:m-0 [&_ul]:m-0">
                {item.content}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </LegalPage>
  );
}
