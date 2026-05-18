import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getCurrentSubscriptionPlan } from "@/lib/subscription";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: monthlySentCount, error: usageError } = await supabase
    .from("send_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "sent")
    .gte("created_at", monthStart.toISOString());

  if (usageError) {
    console.error("[layout] monthly usage fetch error:", usageError);
  }

  const currentPlan = await getCurrentSubscriptionPlan(user.id, user.email);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar monthlySentCount={monthlySentCount ?? 0} currentPlan={currentPlan.name} />
      <Header userEmail={user.email} currentPlan={currentPlan.name} />
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
