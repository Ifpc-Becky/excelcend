/**
 * ExcelCend 共通メールユーティリティ
 * send-email / resend-email の両 API から利用する
 */

// -------------------------------------------------------
// {companyName} プレースホルダーを置換する
// -------------------------------------------------------
export function applyTemplate(template: string, companyName: string): string {
  return template.replace(/\{companyName\}/g, companyName);
}

// -------------------------------------------------------
// プレーンテキスト本文 → HTML 段落に変換
// -------------------------------------------------------
function textToHtmlParagraphs(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="font-size: 14px; color: #475569; line-height: 1.8; margin: 0 0 12px;">${line}</p>`
        : `<p style="margin: 0 0 8px;"></p>`
    )
    .join("\n");
}

// -------------------------------------------------------
// メール HTML 本文ビルダー
// bodyText を渡すとテンプレート本文を使用、省略時はデフォルト本文
// -------------------------------------------------------
export function buildEmailHtml(companyName: string, bodyText?: string): string {
  const resolvedBody = bodyText
    ? applyTemplate(bodyText, companyName)
    : `${companyName}でございます。\nいつもお世話になっております。\n添付ファイルにて請求書をお送りいたします。\nご確認のほどよろしくお願いいたします。`;

  return `
    <div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 32px; color: #1e293b; background: #ffffff;">

      <!-- ヘッダー -->
      <div style="margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
        <span style="background: #2563eb; color: white; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.08em;">
          ExcelCend
        </span>
      </div>

      <!-- 本文 -->
      <h2 style="font-size: 20px; font-weight: bold; margin: 0 0 20px; color: #0f172a;">
        請求書をお送りいたします
      </h2>

      ${textToHtmlParagraphs(resolvedBody)}

      <!-- 送信元情報 -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px 20px; margin: 24px 0 32px; border-left: 3px solid #2563eb;">
        <p style="font-size: 13px; color: #64748b; margin: 0 0 4px;">送信元</p>
        <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin: 0;">${companyName}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 20px;" />

      <!-- 自動送信テキスト -->
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 28px; line-height: 1.6;">
        このメールは ExcelCend により自動送信されています。
      </p>

      <!-- CTA -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
        <p style="font-size: 13px; color: #64748b; margin: 0 0 14px; font-weight: 500;">
          Excelの請求書、そのまま送れてますか？
        </p>
        <a
          href="https://excelcend.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 22px; border-radius: 8px; letter-spacing: 0.02em;"
        >
          ExcelCendを無料で試す
        </a>
      </div>

    </div>
  `;
}

// -------------------------------------------------------
// Resend エラーメッセージを日本語に変換
// -------------------------------------------------------
export function toJapaneseError(msg: string): string {
  if (msg.includes("Invalid API Key") || msg.includes("api_key")) {
    return "Resend APIキーが無効です。.env.local の RESEND_API_KEY を確認してください。";
  }
  if (msg.includes("domain") || msg.includes("from")) {
    return "送信元ドメインが認証されていません。Resendダッシュボードでドメインを確認してください。";
  }
  if (msg.includes("rate")) {
    return "送信制限に達しました。しばらく経ってから再試行してください。";
  }
  return `メール送信に失敗しました: ${msg}`;
}

