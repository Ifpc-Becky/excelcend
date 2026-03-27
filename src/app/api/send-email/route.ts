import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { buildEmailHtml, toJapaneseError } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

// メールアドレスの簡易バリデーション
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  // ① ログインユーザー確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "ログインしていません" },
      { status: 401 }
    );
  }

  // ② リクエストボディ取得・バリデーション
  let to: string;
  let subject: string;
  let pdfPath: string;
  let fileName: string;
  let companyName: string;
  let sourcePath: string;
  let emailBody: string;

  try {
    const body = await req.json();
    to          = (body.to          ?? "").trim();
    subject     = (body.subject     ?? "").trim();
    pdfPath     = (body.pdfPath     ?? "").trim();
    fileName    = (body.fileName    ?? "invoice.pdf").trim();
    companyName = (body.companyName ?? "").trim();
    sourcePath  = (body.sourcePath  ?? "").trim();
    emailBody   = (body.emailBody   ?? "").trim(); // テンプレート本文（省略可）

    if (!to || !subject || !pdfPath) {
      return NextResponse.json(
        { error: "宛先・件名・PDFパスは必須です" },
        { status: 400 }
      );
    }
    if (!companyName) {
      return NextResponse.json(
        { error: "送信元会社名は必須です" },
        { status: 400 }
      );
    }
    if (!isValidEmail(to)) {
      return NextResponse.json(
        { error: "メールアドレスの形式が正しくありません" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  // ③ セキュリティ: 自分の pdf フォルダのみ許可
  if (!pdfPath.startsWith(`pdf/${user.id}/`)) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  // ④ pdf-files バケットから PDF をダウンロード
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("pdf-files")
    .download(pdfPath);

  if (downloadError || !fileData) {
    console.error("[send-email] PDF download error:", downloadError);
    return NextResponse.json(
      { error: "PDFファイルの取得に失敗しました。ファイルが存在するか確認してください。" },
      { status: 500 }
    );
  }

  // ⑤ Blob → ArrayBuffer → Buffer
  let fileBuffer: Buffer;
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[send-email] Buffer conversion error:", err);
    return NextResponse.json(
      { error: "PDFファイルの読み込みに失敗しました" },
      { status: 500 }
    );
  }

  // ⑥ Resend でメール送信
  const { data, error } = await resend.emails.send({
    from: "ExcelCend <onboarding@resend.dev>",
    to: [to],
    subject: subject,
    html: buildEmailHtml(companyName, emailBody || undefined),
    attachments: [
      {
        filename: fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`,
        content: fileBuffer,
      },
    ],
  });

  if (error) {
    console.error("[send-email] Resend error:", error);

    // 送信失敗ログを DB に保存（失敗してもログは残す）
    await supabase.from("send_logs").insert({
      user_id:          user.id,
      company_name:     companyName,
      to_email:         to,
      subject:          subject,
      pdf_path:         pdfPath  || null,
      source_file_path: sourcePath || null,
      status:           "failed",
    });

    const msg = typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : String(error);

    return NextResponse.json({ error: toJapaneseError(msg) }, { status: 500 });
  }

  // ⑦ 送信成功ログを DB に保存
  const { error: logError } = await supabase.from("send_logs").insert({
    user_id:          user.id,
    company_name:     companyName,
    to_email:         to,
    subject:          subject,
    pdf_path:         pdfPath  || null,
    source_file_path: sourcePath || null,
    status:           "sent",
  });

  if (logError) {
    // ログ保存失敗はサイレントエラー（送信自体は成功しているため）
    console.error("[send-email] Log insert error:", logError);
  }

  // ⑧ 顧客を自動登録（同一 company_name + email が未登録の場合のみ）
  if (companyName && to) {
    const { error: customerError } = await supabase
      .from("customers")
      .insert({
        user_id:      user.id,
        company_name: companyName,
        email:        to,
      });
    // unique 制約違反（既存顧客）はエラーコード 23505 → 無視
    if (customerError && customerError.code !== "23505") {
      console.error("[send-email] Customer auto-register error:", customerError);
    }
  }

  return NextResponse.json({
    success: true,
    messageId: data?.id,
    message: `${to} へメールを送信しました`,
  });
}
