import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogsClient, { type SendLog } from "./LogsClient";
import { getCurrentSubscriptionPlan } from "@/lib/subscription";

export default async function LogsPage() {
  const supabase = await createClient();

  // 認証確認
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // send_logs を取得（新しい順、最大100件）
  const { data: logs, error } = await supabase
    .from("send_logs")
    .select(
      "id, company_name, to_email, cc_emails, subject, pdf_path, source_file_path, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[logs] fetch error:", error);
  }

  const initialLogs: SendLog[] = logs ?? [];
  const currentPlan = await getCurrentSubscriptionPlan(user.id, user.email);

  return <LogsClient initialLogs={initialLogs} currentPlan={currentPlan.name} />;
}
