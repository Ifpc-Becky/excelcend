import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "IDが指定されていません" }, { status: 400 });
  }

  // RLS により自分のレコードのみ削除される
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // 二重確認

  if (error) {
    console.error("[customers DELETE] error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
