import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  const { data: logs, error } = await supabase
    .from("send_logs")
    .select(
      "id, company_name, to_email, subject, pdf_path, source_file_path, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[api/logs] fetch error:", error);
    return NextResponse.json({ error: "ログの取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(logs ?? []);
}
