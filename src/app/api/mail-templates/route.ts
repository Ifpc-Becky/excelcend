import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// -------------------------------------------------------
// デフォルトテンプレート定数
// -------------------------------------------------------
import { DEFAULT_SUBJECT_TEMPLATE, DEFAULT_BODY_TEMPLATE } from "@/lib/mail-templates";

// -------------------------------------------------------
// GET /api/mail-templates
// default テンプレートを返す。未存在なら自動作成して返す。
// -------------------------------------------------------
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  // 取得試行
  const { data: existing, error: fetchError } = await supabase
    .from("mail_templates")
    .select("id, template_name, subject_template, body_template, updated_at")
    .eq("user_id", user.id)
    .eq("template_name", "default")
    .maybeSingle();

  if (fetchError) {
    console.error("[mail-templates GET] fetch error:", fetchError);
    return NextResponse.json({ error: "テンプレートの取得に失敗しました" }, { status: 500 });
  }

  // 既存があればそのまま返す
  if (existing) {
    return NextResponse.json(existing);
  }

  // 未存在 → デフォルトを自動作成
  const { data: created, error: insertError } = await supabase
    .from("mail_templates")
    .insert({
      user_id:          user.id,
      template_name:    "default",
      subject_template: DEFAULT_SUBJECT_TEMPLATE,
      body_template:    DEFAULT_BODY_TEMPLATE,
    })
    .select("id, template_name, subject_template, body_template, updated_at")
    .single();

  if (insertError) {
    // 競合（同時リクエスト等）の場合は再取得
    if (insertError.code === "23505") {
      const { data: retry } = await supabase
        .from("mail_templates")
        .select("id, template_name, subject_template, body_template, updated_at")
        .eq("user_id", user.id)
        .eq("template_name", "default")
        .maybeSingle();
      if (retry) return NextResponse.json(retry);
    }
    console.error("[mail-templates GET] insert error:", insertError);
    // 作成失敗時はデフォルト値をそのまま返す（DBに依存しない fallback）
    return NextResponse.json({
      id:               null,
      template_name:    "default",
      subject_template: DEFAULT_SUBJECT_TEMPLATE,
      body_template:    DEFAULT_BODY_TEMPLATE,
      updated_at:       null,
    });
  }

  return NextResponse.json(created);
}

// -------------------------------------------------------
// POST /api/mail-templates
// upsert（template_name 単位で insert or update）
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  let templateName: string;
  let subjectTemplate: string;
  let bodyTemplate: string;

  try {
    const body     = await req.json();
    templateName   = (body.templateName   ?? "default").trim();
    subjectTemplate = (body.subjectTemplate ?? "").trim();
    bodyTemplate   = (body.bodyTemplate   ?? "").trim();

    if (!bodyTemplate) {
      return NextResponse.json({ error: "本文テンプレートは必須です" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  // upsert（user_id + template_name の unique 制約を利用）
  const { data, error } = await supabase
    .from("mail_templates")
    .upsert(
      {
        user_id:          user.id,
        template_name:    templateName,
        subject_template: subjectTemplate || null,
        body_template:    bodyTemplate,
      },
      { onConflict: "user_id,template_name" }
    )
    .select("id, template_name, subject_template, body_template, updated_at")
    .single();

  if (error) {
    console.error("[mail-templates POST] upsert error:", error);
    return NextResponse.json({ error: "テンプレートの保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true, template: data });
}
