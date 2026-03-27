import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
interface CsvRow {
  company_name: string;
  email: string;
  contact_name: string | null;
  notes: string | null;
}

interface ParseResult {
  rows: CsvRow[];
  parseErrors: string[]; // スキップした行の理由
}

// -------------------------------------------------------
// シンプル CSV パーサー
// - ヘッダー行必須
// - 空行無視
// - ダブルクォート対応（フィールド内カンマ・改行）
// - 必須列（company_name / email）欠損行はスキップ
// -------------------------------------------------------
function parseCsv(text: string): ParseResult {
  const rows: CsvRow[] = [];
  const parseErrors: string[] = [];

  // 改行を統一
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 行分割（ダブルクォート内の改行は無視するため状態機械で処理）
  const lines: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '"') {
      // エスケープ "" の処理
      if (inQuote && normalized[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "\n" && !inQuote) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  // フィールド分割
  function splitFields(line: string): string[] {
    const fields: string[] = [];
    let field = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        fields.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  // 空行除去
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 2) {
    parseErrors.push("ヘッダー行とデータ行が必要です");
    return { rows, parseErrors };
  }

  // ヘッダー解析
  const headers = splitFields(nonEmpty[0]).map((h) =>
    h.toLowerCase().replace(/['"]/g, "").trim()
  );

  const colCompany = headers.indexOf("company_name");
  const colEmail   = headers.indexOf("email");
  const colContact = headers.indexOf("contact_name");
  const colNotes   = headers.indexOf("notes");

  if (colCompany === -1 || colEmail === -1) {
    parseErrors.push(
      "ヘッダーに company_name と email が必要です（現在のヘッダー: " +
        headers.join(", ") + "）"
    );
    return { rows, parseErrors };
  }

  // データ行処理
  for (let i = 1; i < nonEmpty.length; i++) {
    const lineNum = i + 1;
    const fields = splitFields(nonEmpty[i]);

    const companyName = (fields[colCompany] ?? "").trim();
    const email       = (fields[colEmail]   ?? "").trim();

    if (!companyName) {
      parseErrors.push(`${lineNum}行目: company_name が空のためスキップ`);
      continue;
    }
    if (!email) {
      parseErrors.push(`${lineNum}行目: email が空のためスキップ`);
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      parseErrors.push(`${lineNum}行目: メールアドレス形式が不正のためスキップ（${email}）`);
      continue;
    }

    rows.push({
      company_name: companyName,
      email,
      contact_name: colContact !== -1 && fields[colContact]?.trim()
        ? fields[colContact].trim()
        : null,
      notes: colNotes !== -1 && fields[colNotes]?.trim()
        ? fields[colNotes].trim()
        : null,
    });
  }

  return { rows, parseErrors };
}

// -------------------------------------------------------
// POST /api/customers/import
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  // ① 認証確認
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  // ② CSVテキスト取得
  let csvText: string;
  try {
    const body = await req.json();
    csvText = (body.csv ?? "").trim();
    if (!csvText) throw new Error("csv is empty");
  } catch {
    return NextResponse.json(
      { error: "CSVデータが送信されていません" },
      { status: 400 }
    );
  }

  // ③ CSVパース
  const { rows, parseErrors } = parseCsv(csvText);

  if (rows.length === 0) {
    return NextResponse.json({
      insertedCount: 0,
      skippedCount:  0,
      parseErrors,
      message: "登録できる行がありませんでした",
    });
  }

  // ④ 重複チェック用に既存の company_name + email を取得
  const { data: existing } = await supabase
    .from("customers")
    .select("company_name, email")
    .eq("user_id", user.id);

  const existingSet = new Set(
    (existing ?? []).map((r) => `${r.company_name}|||${r.email}`)
  );

  // ⑤ 新規行と重複行を分離
  const toInsert: CsvRow[] = [];
  let skippedCount = 0;

  for (const row of rows) {
    const key = `${row.company_name}|||${row.email}`;
    if (existingSet.has(key)) {
      skippedCount++;
    } else {
      toInsert.push(row);
      existingSet.add(key); // 同一CSV内の重複も防ぐ
    }
  }

  if (toInsert.length === 0) {
    return NextResponse.json({
      insertedCount: 0,
      skippedCount,
      parseErrors,
      message: `全 ${skippedCount} 件が重複のためスキップされました`,
    });
  }

  // ⑥ 一括 insert（DB側 unique 制約違反も ignoreDuplicates で吸収）
  const records = toInsert.map((row) => ({
    user_id:      user.id,
    company_name: row.company_name,
    email:        row.email,
    contact_name: row.contact_name,
    notes:        row.notes,
  }));

  const { error: insertError } = await supabase
    .from("customers")
    .insert(records);

  if (insertError) {
    console.error("[customers/import] insert error:", insertError);
    return NextResponse.json(
      { error: "インポート中にエラーが発生しました: " + insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    insertedCount: toInsert.length,
    skippedCount,
    parseErrors,
    message: `${toInsert.length} 件を登録しました` +
      (skippedCount > 0 ? `（${skippedCount} 件は重複のためスキップ）` : ""),
  });
}
