import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// -------------------------------------------------------
// GET /api/customers — 一覧取得
// -------------------------------------------------------
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, company_name, email, contact_name, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[customers GET] error:", error);
    return NextResponse.json({ error: "顧客一覧の取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// -------------------------------------------------------
// POST /api/customers — 顧客追加
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  let companyName: string;
  let email: string;
  let contactName: string;
  let notes: string;

  try {
    const body    = await req.json();
    companyName   = (body.companyName  ?? "").trim();
    email         = (body.email        ?? "").trim();
    contactName   = (body.contactName  ?? "").trim();
    notes         = (body.notes        ?? "").trim();

    if (!companyName || !email) {
      return NextResponse.json(
        { error: "会社名とメールアドレスは必須です" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

  const { data, error } = await supabase
    .from("customers")
    .insert({
      user_id:      user.id,
      company_name: companyName,
      email,
      contact_name: contactName || null,
      notes:        notes       || null,
    })
    .select("id, company_name, email, contact_name, notes, created_at")
    .single();

  if (error) {
    console.error("[customers POST] error:", error);
    // unique 制約違反（同一ユーザーの同一会社名+メール）
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "同じ会社名・メールアドレスの顧客が既に登録されています" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "顧客の追加に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true, customer: data }, { status: 201 });
}
