import { Metadata } from "next";
import UploadClient from "./UploadClient";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSubscriptionPlan, type SubscriptionPlan } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "請求書アップロード | ExcelCend",
};

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentPlan: SubscriptionPlan = user
    ? (await getCurrentSubscriptionPlan(user.id, user.email)).name
    : "Free";

  return <UploadClient currentPlan={currentPlan} />;
}
