import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "利用規約 | ExcelCend",
  description: "ExcelCend の利用規約ページです。",
};

const sectionClassName = "mt-14 space-y-5 first:mt-0 break-words sm:mt-16 sm:space-y-6";
const headingClassName =
  "my-0 border-l-4 border-blue-500 pl-4 text-xl font-bold leading-8 tracking-tight text-slate-900 sm:text-2xl sm:leading-9";
const paragraphClassName = "my-0 leading-8 text-slate-700 sm:leading-8";
const listClassName =
  "my-0 list-inside space-y-3 pl-0 leading-8 text-slate-700 marker:text-blue-500 sm:leading-8 [&>li]:rounded-xl [&>li]:border [&>li]:border-slate-100 [&>li]:bg-slate-50 [&>li]:px-4 [&>li]:py-3";
const priceListClassName = "my-0 grid gap-4 sm:grid-cols-2";
const priceItemClassName =
  "flex min-h-24 flex-col justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm sm:px-5";
const priceNameClassName = "text-base font-semibold leading-7 text-slate-900";
const priceDetailClassName = "my-0 leading-7 text-slate-600";
const contactListClassName = "my-0 space-y-3 leading-8 text-slate-700 sm:leading-8";
const contactItemClassName =
  "grid gap-x-3 gap-y-1 sm:grid-cols-[8.5rem_minmax(0,1fr)]";
const contactLabelClassName = "font-semibold text-slate-900";

export default function TermsPage() {
  return (
    <LegalPage title="利用規約" description="ExcelCend の利用規約です。">
      <div className="not-prose min-w-0 overflow-x-hidden text-[15px] leading-8 sm:text-base">
        <section className={sectionClassName}>
          <p className={paragraphClassName}>
            本利用規約（以下「本規約」といいます。）は、株式会社イフペック（以下「当社」といいます。）が提供する「ExcelCend」（以下「本サービス」といいます。）の利用条件を定めるものです。
          </p>
          <p className={paragraphClassName}>
            利用者は、本規約に同意のうえ、本サービスを利用するものとします。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第1条（適用）</h2>
          <ol className={listClassName}>
            <li>本規約は、利用者と当社との間の本サービス利用に関する一切の関係に適用されます。</li>
            <li>当社が本サービス上で掲載するルール、ガイドライン等は、本規約の一部を構成します。</li>
          </ol>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第2条（サービス内容）</h2>
          <p className={paragraphClassName}>
            本サービスは、Excel形式等の請求書ファイルをアップロードし、PDF化、メール送信、送信履歴管理等を行うクラウドサービスです。
          </p>
          <p className={paragraphClassName}>当社は、機能追加、改善、変更を行う場合があります。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第3条（アカウント登録）</h2>
          <ol className={listClassName}>
            <li>利用希望者は、当社所定の方法で登録申請を行います。</li>
            <li>当社は、以下の場合、登録を拒否または取消できるものとします。</li>
          </ol>
          <ul className={listClassName}>
            <li>虚偽情報による登録</li>
            <li>過去の規約違反</li>
            <li>不正利用の恐れ</li>
            <li>その他、当社が不適切と判断した場合</li>
          </ul>
          <p className={paragraphClassName}>利用者は、アカウント情報を自己責任で管理するものとします。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第4条（禁止事項）</h2>
          <p className={paragraphClassName}>利用者は、以下を行ってはなりません。</p>
          <ul className={listClassName}>
            <li>法令違反または公序良俗違反行為</li>
            <li>不正アクセス、システム負荷行為</li>
            <li>他者へのなりすまし</li>
            <li>不正請求書、違法取引、詐欺目的利用</li>
            <li>スパム送信、迷惑行為</li>
            <li>他利用者または当社に損害を与える行為</li>
            <li>サービス運営妨害</li>
          </ul>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第5条（利用料金）</h2>
          <p className={paragraphClassName}>本サービスには無料プランおよび有料プランがあります。</p>
          <dl className={priceListClassName}>
            <div className={priceItemClassName}>
              <dt className={priceNameClassName}>Free</dt>
              <dd className={priceDetailClassName}>0円（月10通）</dd>
            </div>
            <div className={priceItemClassName}>
              <dt className={priceNameClassName}>Starter</dt>
              <dd className={priceDetailClassName}>390円（月30通）</dd>
            </div>
            <div className={priceItemClassName}>
              <dt className={priceNameClassName}>Standard</dt>
              <dd className={priceDetailClassName}>980円（月100通）</dd>
            </div>
            <div className={priceItemClassName}>
              <dt className={priceNameClassName}>Business</dt>
              <dd className={priceDetailClassName}>2,980円（無制限）</dd>
            </div>
          </dl>
          <p className={paragraphClassName}>料金、機能、利用条件は予告なく変更される場合があります。</p>
          <p className={paragraphClassName}>有料プラン料金は、決済サービスを通じて支払うものとします。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第6条（契約期間・解約）</h2>
          <p className={paragraphClassName}>利用者は、いつでもプラン解約できます。</p>
          <p className={paragraphClassName}>解約後も契約期間終了までは利用可能です。</p>
          <p className={paragraphClassName}>既に支払済み料金について、法令上必要な場合を除き返金しません。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第7条（データ管理）</h2>
          <p className={paragraphClassName}>
            利用者は、送信データ、顧客情報、請求書データ等について自己責任で管理するものとします。
          </p>
          <p className={paragraphClassName}>当社はデータ保全に努めますが、完全な保存を保証しません。</p>
          <p className={paragraphClassName}>重要データについては利用者自身でバックアップを行ってください。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第8条（サービス停止・変更）</h2>
          <p className={paragraphClassName}>
            当社は以下の場合、事前通知なく本サービスを停止または変更できるものとします。
          </p>
          <ul className={listClassName}>
            <li>メンテナンス</li>
            <li>障害対応</li>
            <li>セキュリティ上必要な場合</li>
            <li>外部サービス障害</li>
            <li>その他運営上必要な場合</li>
          </ul>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第9条（知的財産権）</h2>
          <p className={paragraphClassName}>本サービスに関する知的財産権は当社または正当な権利者に帰属します。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第10条（保証の否認・免責）</h2>
          <p className={paragraphClassName}>当社は、本サービスの完全性、正確性、継続性、特定目的適合性を保証しません。</p>
          <p className={paragraphClassName}>
            メール送信失敗、外部サービス障害、通信障害、利用者環境等に起因する損害について責任を負いません。
          </p>
          <p className={paragraphClassName}>利用者間または第三者とのトラブルについて、当社は責任を負いません。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第11条（損害賠償）</h2>
          <p className={paragraphClassName}>
            当社の責任は、当社に故意または重過失がある場合を除き、直近1か月分の利用料金を上限とします。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第12条（利用停止・削除）</h2>
          <p className={paragraphClassName}>
            当社は、利用者が本規約違反した場合、事前通知なくアカウント停止または削除できます。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第13条（規約変更）</h2>
          <p className={paragraphClassName}>当社は必要に応じて本規約を変更できます。</p>
          <p className={paragraphClassName}>変更後の内容は、本サービス上へ掲載した時点で効力を生じるものとします。</p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第14条（準拠法・裁判管轄）</h2>
          <p className={paragraphClassName}>本規約は日本法に準拠します。</p>
          <p className={paragraphClassName}>
            本サービスに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>第15条（お問い合わせ）</h2>
          <dl className={contactListClassName}>
            <div className={contactItemClassName}>
              <dt className={contactLabelClassName}>運営会社：</dt>
              <dd className="min-w-0">株式会社イフペック</dd>
            </div>
            <div className={contactItemClassName}>
              <dt className={contactLabelClassName}>責任者：</dt>
              <dd className="min-w-0">ムオンベキゆきこ</dd>
            </div>
            <div className={contactItemClassName}>
              <dt className={contactLabelClassName}>所在地：</dt>
              <dd className="min-w-0">東京都港区六本木6-6-13 スプリームマンション302</dd>
            </div>
            <div className={contactItemClassName}>
              <dt className={contactLabelClassName}>メールアドレス：</dt>
              <dd className="min-w-0">support@excelcend.com</dd>
            </div>
          </dl>
          <p className={paragraphClassName}>以上</p>
        </section>
      </div>
    </LegalPage>
  );
}
