import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | ExcelCend",
  description: "ExcelCend のプライバシーポリシーページです。",
};

const sectionClassName =
  "space-y-4 border-t border-slate-100 pt-8 first:border-t-0 first:pt-0";
const headingClassName = "text-xl font-bold tracking-tight text-slate-900";
const paragraphClassName = "leading-8 text-slate-700";
const listClassName =
  "my-0 space-y-2 pl-6 leading-8 text-slate-700 marker:text-blue-500";
const serviceListClassName = "not-prose grid gap-3 sm:grid-cols-2";
const serviceItemClassName =
  "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 leading-7 text-slate-700 shadow-sm";
const serviceNameClassName = "font-semibold text-slate-900";

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" description="ExcelCend のプライバシーポリシーです。">
      <div className="space-y-8 break-words text-base leading-8 text-slate-700 [overflow-wrap:anywhere]">
        <section className={sectionClassName}>
          <p className={paragraphClassName}>
            ExcelCend（以下「当社」といいます。）は、本サービスにおける利用者情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>1. 取得する情報</h2>
          <p className={paragraphClassName}>
            当社は、本サービスの提供にあたり、以下の情報を取得する場合があります。
          </p>
          <ol className={listClassName}>
            <li>氏名、会社名、メールアドレス</li>
            <li>ログイン情報、認証情報</li>
            <li>請求書ファイル、PDFファイル、送信先情報、顧客情報</li>
            <li>送信履歴、送信日時、送信ステータス</li>
            <li>決済に関する情報</li>
            <li>Cookie、アクセスログ、端末情報、ブラウザ情報、IPアドレス</li>
            <li>お問い合わせ内容</li>
          </ol>
          <p className={paragraphClassName}>
            なお、クレジットカード番号等の決済情報は、決済代行サービスである Stripe が管理し、当社は原則としてカード番号を保持しません。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>2. 利用目的</h2>
          <p className={paragraphClassName}>取得した情報は、以下の目的で利用します。</p>
          <ol className={listClassName}>
            <li>本サービスの提供、認証、本人確認のため</li>
            <li>PDF変換、メール送信、送信履歴管理、顧客管理のため</li>
            <li>利用料金の決済、請求、プラン管理のため</li>
            <li>お問い合わせ、サポート対応のため</li>
            <li>不正利用、障害、トラブルの調査・防止のため</li>
            <li>サービス改善、利用状況分析のため</li>
            <li>重要なお知らせ、規約変更、メンテナンス情報等の通知のため</li>
            <li>法令に基づく対応のため</li>
          </ol>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>3. 第三者サービスの利用</h2>
          <p className={paragraphClassName}>
            当社は、本サービス提供のため、以下の外部サービスを利用しています。
          </p>
          <ul className={serviceListClassName}>
            <li className={serviceItemClassName}>
              <span className={serviceNameClassName}>Stripe</span>（決済）
            </li>
            <li className={serviceItemClassName}>
              <span className={serviceNameClassName}>Supabase</span>（データ保存・認証）
            </li>
            <li className={serviceItemClassName}>
              <span className={serviceNameClassName}>Resend</span>（メール送信）
            </li>
            <li className={serviceItemClassName}>
              <span className={serviceNameClassName}>Vercel</span>（ホスティング）
            </li>
          </ul>
          <p className={paragraphClassName}>
            これらの外部サービスには、本サービス提供に必要な範囲で情報が送信される場合があります。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>4. 第三者提供</h2>
          <p className={paragraphClassName}>
            当社は、以下の場合を除き、利用者の個人情報を第三者に提供しません。
          </p>
          <ol className={listClassName}>
            <li>利用者の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合</li>
            <li>本サービス提供に必要な範囲で業務委託先に提供する場合</li>
            <li>合併、事業譲渡その他事業承継に伴って提供する場合</li>
          </ol>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>5. 業務委託</h2>
          <p className={paragraphClassName}>
            当社は、サービス運営、決済、メール送信、データ保管、問い合わせ対応等のため、個人情報の取扱いを外部事業者に委託する場合があります。この場合、当社は必要かつ適切な監督を行います。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>6. Cookieおよびアクセス解析</h2>
          <p className={paragraphClassName}>
            当社は、利用状況の把握、サービス改善、広告効果測定等のため、Cookieおよびアクセス解析ツールを利用する場合があります。
          </p>
          <p className={paragraphClassName}>
            利用者は、ブラウザ設定により Cookie を無効化できます。ただし、一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>7. 安全管理</h2>
          <p className={paragraphClassName}>
            当社は、取得した情報について、不正アクセス、漏えい、滅失、毀損等を防止するため、必要かつ適切な安全管理措置を講じます。
          </p>
          <p className={paragraphClassName}>
            ただし、インターネット通信およびクラウドサービスの性質上、完全な安全性を保証するものではありません。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>8. データの保存期間</h2>
          <p className={paragraphClassName}>
            当社は、本サービス提供に必要な期間、または法令上必要な期間、利用者情報を保存します。
          </p>
          <p className={paragraphClassName}>
            利用者が退会または解約した場合でも、法令対応、トラブル防止、不正利用防止、会計処理等に必要な範囲で一定期間保存する場合があります。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>9. 開示・訂正・削除等</h2>
          <p className={paragraphClassName}>
            利用者は、当社所定の方法により、自己の個人情報の開示、訂正、利用停止、削除等を求めることができます。
          </p>
          <p className={paragraphClassName}>当社は、本人確認のうえ、法令に従い対応します。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>10. 未成年者の利用</h2>
          <p className={paragraphClassName}>
            未成年者が本サービスを利用する場合、親権者等の法定代理人の同意を得たうえで利用するものとします。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>11. プライバシーポリシーの変更</h2>
          <p className={paragraphClassName}>当社は、必要に応じて本ポリシーを変更できます。</p>
          <p className={paragraphClassName}>
            変更後の内容は、本サービス上に表示した時点で効力を生じるものとします。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>12. お問い合わせ窓口</h2>
          <address className="not-italic leading-8 text-slate-700">
            運営会社：株式会社イフペック<br />
            責任者：ムオンベキゆきこ<br />
            所在地：東京都港区六本木6-6-13 スプリームマンション302<br />
            メールアドレス：
            <a
              className="font-medium text-blue-600 underline-offset-4 hover:underline"
              href="mailto:support@excelcend.com"
            >
              support@excelcend.com
            </a>
          </address>
        </section>

        <p className={paragraphClassName}>以上</p>
      </div>
    </LegalPage>
  );
}
