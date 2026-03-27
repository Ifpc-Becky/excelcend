import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CustomersClient, { type Customer } from "./CustomersClient";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("customers")
    .select("id, company_name, email, contact_name, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[customers page] fetch error:", error);
  }

  const initialCustomers: Customer[] = data ?? [];

  return <CustomersClient initialCustomers={initialCustomers} />;
}
