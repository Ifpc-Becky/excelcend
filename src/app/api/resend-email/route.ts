import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { buildEmailHtml, toJapaneseError } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // ① ログインユーザー確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  // ② リクエストボディ
  let logId: string;
  try {
    const body = await req.json();
    logId = (body.logId ?? "").trim();
    if (!logId) throw new Error("logId missing");
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  // ③ send_logs から対象ログを取得
  const { data: log, error: logFetchError } = await supabase
    .from("send_logs")
    .select(
      "id, user_id, company_name, to_email, subject, pdf_path, source_file_path"
    )
    .eq("id", logId)
    .single();

  if (logFetchError || !log) {
    console.error("[resend-email] log fetch error:", logFetchError);
    return NextResponse.json(
      { error: "送信ログが見つかりません" },
      { status: 404 }
    );
  }

  // ④ 自分のログか確認（他人のログは操作不可）
  if (log.user_id !== user.id) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  // ⑤ pdf_path の存在確認
  if (!log.pdf_path) {
    return NextResponse.json(
      { error: "このログには PDF が紐付いていません。再度アップロードから送信してください。" },
      { status: 422 }
    );
  }

  // ⑥ pdf-files バケットから PDF をダウンロード
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("pdf-files")
    .download(log.pdf_path);

  if (downloadError || !fileData) {
    console.error("[resend-email] PDF download error:", downloadError);

    // ダウンロード失敗ログを記録
    await supabase.from("send_logs").insert({
      user_id:          user.id,
      company_name:     log.company_name,
      to_email:         log.to_email,
      subject:          log.subject,
      pdf_path:         log.pdf_path,
      source_file_path: log.source_file_path,
      status:           "failed",
    });

    return NextResponse.json(
      { error: "PDFファイルの取得に失敗しました。ファイルが削除されている可能性があります。" },
      { status: 500 }
    );
  }

  // ⑦ Blob → Buffer
  let fileBuffer: Buffer;
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[resend-email] buffer error:", err);
    return NextResponse.json(
      { error: "PDFファイルの読み込みに失敗しました" },
      { status: 500 }
    );
  }

  // 添付ファイル名: pdf_path の末尾ファイル名を使う
  const pdfFileName = log.pdf_path.split("/").pop() ?? "invoice.pdf";

  // ⑧ Resend で再送
  const { data: resendData, error: resendError } = await resend.emails.send({
    from: "ExcelCend <onboarding@resend.dev>",
    to:   [log.to_email],
    subject: log.subject,
    html: buildEmailHtml(log.company_name),
    attachments: [
      {
        filename: pdfFileName,
        content:  fileBuffer,
      },
    ],
  });

  if (resendError) {
    console.error("[resend-email] Resend error:", resendError);

    // 送信失敗ログを記録
    await supabase.from("send_logs").insert({
      user_id:          user.id,
      company_name:     log.company_name,
      to_email:         log.to_email,
      subject:          log.subject,
      pdf_path:         log.pdf_path,
      source_file_path: log.source_file_path,
      status:           "failed",
    });

    const msg =
      typeof resendError === "object" && "message" in resendError
        ? String((resendError as { message: string }).message)
        : String(resendError);

    return NextResponse.json(
      { error: toJapaneseError(msg) },
      { status: 500 }
    );
  }

  // ⑨ 送信成功ログを記録（新レコードとして追加）
  const { error: insertError } = await supabase.from("send_logs").insert({
    user_id:          user.id,
    company_name:     log.company_name,
    to_email:         log.to_email,
    subject:          log.subject,
    pdf_path:         log.pdf_path,
    source_file_path: log.source_file_path,
    status:           "sent",
  });

  if (insertError) {
    // ログ保存失敗はサイレントエラー（送信自体は成功）
    console.error("[resend-email] log insert error:", insertError);
  }

  return NextResponse.json({
    success:   true,
    messageId: resendData?.id,
    message:   `${log.to_email} へ再送しました`,
  });
}
