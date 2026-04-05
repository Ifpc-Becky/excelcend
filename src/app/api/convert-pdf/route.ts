import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = "/tmp/excelcend";

const RAILWAY_PDF_URL =
  process.env.RAILWAY_PDF_URL || "https://excelcend-pdf-production.up.railway.app";

// -------------------------------------------------------
// POST /api/convert-pdf
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  let tmpExcelPath = "";

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

  let sourcePath: string;
  let fileName: string;
  try {
    const body = await req.json();
    sourcePath = body.sourcePath;
    fileName = body.fileName;
    if (!sourcePath || !fileName) throw new Error("missing fields");
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 }
    );
  }

  // セキュリティ: 自分のパスのみ許可
  if (!sourcePath.startsWith(`uploads/${user.id}/`)) {
    return NextResponse.json(
      { error: "アクセス権限がありません" },
      { status: 403 }
    );
  }

  // ② tmp ディレクトリ準備
  await fs.mkdir(TMP_DIR, { recursive: true });

  // 一時ファイルパスを一意に決定
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  tmpExcelPath = path.join(TMP_DIR, `${uniquePrefix}_${safeFileName}`);

  try {
    // ③ source-files から Excel をダウンロード
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("source-files")
      .download(sourcePath);

    if (downloadError || !fileData) {
      console.error("[download error]", downloadError);
      return NextResponse.json(
        { error: "Excelファイルの取得に失敗しました" },
        { status: 500 }
      );
    }

    // ArrayBuffer → Buffer → ファイル書き込み
    const arrayBuffer = await fileData.arrayBuffer();
    await fs.writeFile(tmpExcelPath, Buffer.from(arrayBuffer));

   const formData = new FormData();
const excelBlob = new Blob([Buffer.from(arrayBuffer)], {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});
formData.append("file", excelBlob, fileName);

const railwayRes = await fetch(`${RAILWAY_PDF_URL}/convert`, {
  method: "POST",
  body: formData,
});

if (!railwayRes.ok) {
  const errorText = await railwayRes.text();
  console.error("[railway convert error]", errorText);
  return NextResponse.json(
    { error: "PDF変換に失敗しました" },
    { status: 500 }
  );
}

const pdfArrayBuffer = await railwayRes.arrayBuffer();
const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // PDF 保存パスを組み立て
    const timestamp = Date.now();
    const baseName = path.basename(fileName, path.extname(fileName));
    const safeBase = baseName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const pdfStoragePath = `pdf/${user.id}/${timestamp}_${safeBase}.pdf`;

    // ⑥ pdf-files バケットへアップロード
    const { error: uploadError } = await supabase.storage
      .from("pdf-files")
      .upload(pdfStoragePath, pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[pdf upload error]", uploadError);
      return NextResponse.json(
        { error: "PDF保存に失敗しました" },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      pdfPath: pdfStoragePath,
      message: "PDF変換・保存が完了しました",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "予期しないエラーが発生しました";
    console.error("[convert-pdf error]", message);

    // エラーメッセージを日本語に変換
    let userMessage = "PDF変換に失敗しました";
    if (message.includes("ENOENT") && message.includes("soffice")) {
      userMessage =
        "LibreOfficeが見つかりません。インストール済みか、パスの設定を確認してください。";
    } else if (message.includes("timeout")) {
      userMessage = "PDF変換がタイムアウトしました。ファイルサイズを確認してください。";
    } else if (message.includes("PDF変換に失敗")) {
      userMessage = message;
    }

    return NextResponse.json({ error: userMessage }, { status: 500 });
  } finally {
  if (tmpExcelPath) {
    await fs.unlink(tmpExcelPath).catch(() => {});
  }
}
}