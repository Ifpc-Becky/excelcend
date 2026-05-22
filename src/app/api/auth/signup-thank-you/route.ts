import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SIGNUP_THANK_YOU_SUBJECT = "ExcelCendへのご登録ありがとうございます";

const SIGNUP_THANK_YOU_TEXT = `ExcelCendへのご登録ありがとうございます。

ExcelCendは、Excel請求書をアップロードするだけで、PDF化からメール送信までをかんたんに行えるサービスです。

ログインはこちら：
https://excelcend.com/auth/login

現在は未契約の為、ログイン後に「設定 ＞ プランと請求」よりプランを選択頂きご契約ください。
決済完了後、すぐにご利用いただけます。

料金プランはこちら：
https://excelcend.com/pricing

ご不明点がありましたら、support@excelcend.com までお気軽にお問い合わせください。

ExcelCend`;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildTextAsHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<br />";
      return `<p style=\"margin:0 0 12px; line-height:1.8; color:#334155;\">${line}</p>`;
    })
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const to = String(email ?? "").trim();

    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: "メールアドレスが不正です" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "ExcelCend <noreply@excelcend.com>",
      to: [to],
      subject: SIGNUP_THANK_YOU_SUBJECT,
      text: SIGNUP_THANK_YOU_TEXT,
      html: `<div style=\"font-family:Arial,'Hiragino Sans',Meiryo,sans-serif;max-width:640px;margin:0 auto;padding:24px;\">${buildTextAsHtml(SIGNUP_THANK_YOU_TEXT)}</div>`,
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
