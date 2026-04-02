import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

// -------------------------------------------------------
// LibreOffice 実行ファイルパス（Windows）
// -------------------------------------------------------
const SOFFICE_PATH =
  process.env.LIBREOFFICE_PATH ||
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

// -------------------------------------------------------
// tmp ディレクトリ（プロジェクトルート直下 ./tmp）
// -------------------------------------------------------
const TMP_DIR = path.join(os.tmpdir(), "excelcend");

// -------------------------------------------------------
// ユーティリティ
// -------------------------------------------------------

/** tmp ディレクトリを確実に作成 */
async function ensureTmpDir(): Promise<void> {
  await fs.mkdir(TMP_DIR, { recursive: true });
}

/** ファイルを安全に削除（失敗しても例外を投げない） */
async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // 一時ファイル削除失敗は無視
  }
}

/**
 * LibreOffice headless で Excel → PDF 変換
 * execFile を使うことでパスのスペースを安全に扱う
 */
async function convertToPdf(inputFile: string, outDir: string): Promise<string> {
  const args = [
    "--headless",
    "--norestore",
    "--nofirststartwizard",
    "--convert-to",
    "pdf",
    "--outdir",
    outDir,
    inputFile,
  ];

  try {
    const { stdout, stderr } = await execFileAsync(SOFFICE_PATH, args, {
      timeout: 120_000, // 2分タイムアウト
      windowsHide: true, // Windowsでウィンドウを非表示
    });

    // LibreOffice は stderr に進捗を出すことがあるため stdout/stderr 両方ログ
    if (stdout) console.log("[LibreOffice stdout]", stdout);
    if (stderr) console.log("[LibreOffice stderr]", stderr);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[LibreOffice error]", message);
    throw new Error(`PDF変換に失敗しました: ${message}`);
  }

  // 出力 PDF パスを組み立て（LibreOffice は拡張子を .pdf に変える）
  const baseName = path.basename(inputFile, path.extname(inputFile));
  const pdfPath = path.join(outDir, `${baseName}.pdf`);

  // 生成されたか確認
  try {
    await fs.access(pdfPath);
  } catch {
    throw new Error("PDF変換に失敗しました: 出力ファイルが見つかりません");
  }

  return pdfPath;
}

// -------------------------------------------------------
// POST /api/convert-pdf
// -------------------------------------------------------
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

  // リクエストボディ取得
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
  await ensureTmpDir();

  // 一時ファイルパスを一意に決定
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const tmpExcelPath = path.join(TMP_DIR, `${uniquePrefix}_${safeFileName}`);

  let tmpPdfPath: string | null = null;

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

    // ④ LibreOffice で PDF 変換
    tmpPdfPath = await convertToPdf(tmpExcelPath, TMP_DIR);

    // ⑤ PDF ファイルを読み込み
    const pdfBuffer = await fs.readFile(tmpPdfPath);

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
    // ⑦ 一時ファイルを必ず削除
    await safeUnlink(tmpExcelPath);
    if (tmpPdfPath) await safeUnlink(tmpPdfPath);
  }
}
