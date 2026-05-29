import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { buildEmailHtml, toJapaneseError } from "@/lib/email";
import { getCurrentSubscriptionPlan, getMonthlyEmailLimit } from "@/lib/subscription";

const resend = new Resend(process.env.RESEND_API_KEY);
const resendFrom = process.env.RESEND_FROM_EMAIL;

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

  const userId = user?.id || "guest";

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
  if (!pdfPath.startsWith(`pdf/${userId}/`)) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  if (sourcePath && !sourcePath.startsWith(`uploads/${userId}/`)) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  // ④ プランごとの月間送信上限チェック（成功送信のみ対象）
  if (user) {
    const currentPlan = await getCurrentSubscriptionPlan(user.id, user.email);
    const monthlyLimit = getMonthlyEmailLimit(currentPlan.name);

    if (monthlyLimit !== null) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: thisMonthSentCount, error: usageError } = await supabase
        .from("send_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("created_at", monthStart.toISOString());

      if (usageError) {
        console.error("[send-email] monthly usage fetch error:", usageError);
        return NextResponse.json(
          { error: "送信数の確認に失敗しました。時間をおいて再度お試しください。" },
          { status: 500 }
        );
      }

      if ((thisMonthSentCount ?? 0) >= monthlyLimit) {
        return NextResponse.json(
          {
            error: "今月の送信上限に達しました。\nプランをアップグレードすると、さらに送信できます。",
            errorCode: "MONTHLY_SEND_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }
  }

  // ⑤ pdf-files バケットから PDF をダウンロード
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

  // ⑥ Blob → ArrayBuffer → Buffer
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

  if (!resendFrom) {
    console.error("[send-email] RESEND_FROM_EMAIL is not configured");
    return NextResponse.json(
      { error: "送信元メールアドレスが設定されていません" },
      { status: 500 }
    );
  }

  // ⑦ Resend でメール送信
  const { data, error } = await resend.emails.send({
    from: `ExcelCend <${resendFrom}>`,
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
    if (user) {
      await supabase.from("send_logs").insert({
        user_id:          user.id,
        company_name:     companyName,
        to_email:         to,
        subject:          subject,
        pdf_path:         pdfPath  || null,
        source_file_path: sourcePath || null,
        status:           "failed",
      });
    }

    const msg = typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : String(error);

    return NextResponse.json({ error: toJapaneseError(msg) }, { status: 500 });
  }

  // ⑧ 送信成功ログを DB に保存
  if (user) {
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
  }

  // ⑨ 顧客を自動登録（同一 company_name + email が未登録の場合のみ）
  if (user && companyName && to) {
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
