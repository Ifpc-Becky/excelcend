import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SIGNUP_THANK_YOU_SUBJECT = "ExcelCendへのご登録ありがとうございます";
const LOGIN_URL = "https://excelcend.com/auth/login";
const PRICING_URL = "https://excelcend.com/pricing";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildSignupThankYouText(companyName?: string): string {
  const salutation = companyName ? `${companyName} 様` : "ご担当者様";
  return `${salutation}

ExcelCendへのご登録ありがとうございます。

ExcelCendは、Excel請求書をアップロードするだけで、PDF化からメール送信までをかんたんに行えるサービスです。

ログインはこちら：
${LOGIN_URL}

現在は未契約のため、ログイン後に「設定 ＞ プランと請求」よりプランをご契約ください。
決済完了後、すぐにご利用いただけます。

料金プランはこちら：
${PRICING_URL}

ご不明点がありましたら、support@excelcend.com までお気軽にお問い合わせください。

ExcelCend`;
}

function buildSignupThankYouHtml(companyName?: string): string {
  const salutation = companyName ? `${companyName} 様` : "ご担当者様";
  return `
  <div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 32px; color: #1e293b; background: #ffffff;">
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 18px;">${salutation}</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 12px;">ExcelCendへのご登録ありがとうございます。</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 24px;">ExcelCendは、Excel請求書をアップロードするだけで、PDF化からメール送信までをかんたんに行えるサービスです。</p>
    <a href="${LOGIN_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:11px 22px; border-radius:8px; margin:0 0 24px;">
      ログインする
    </a>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 20px;">現在は未契約のため、ログイン後に「設定 ＞ プランと請求」よりプランをご契約ください。<br />決済完了後、すぐにご利用いただけます。</p>
    <a href="${PRICING_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:11px 22px; border-radius:8px; margin:0 0 24px;">
      料金プランを見る
    </a>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 24px;">ご不明点がありましたら、support@excelcend.com までお気軽にお問い合わせください。</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0;">ExcelCend</p>
  </div>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, companyName } = await req.json();
    const to = String(email ?? "").trim();
    const normalizedCompanyName = String(companyName ?? "").trim();

    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: "メールアドレスが不正です" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "ExcelCend <noreply@excelcend.com>",
      to: [to],
      subject: SIGNUP_THANK_YOU_SUBJECT,
      text: buildSignupThankYouText(normalizedCompanyName || undefined),
      html: buildSignupThankYouHtml(normalizedCompanyName || undefined),
    });

    if (error) {
      console.error("[signup-thank-you] Resend error:", error);
      return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error("[signup-thank-you] Unexpected error:", error);
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }
}
