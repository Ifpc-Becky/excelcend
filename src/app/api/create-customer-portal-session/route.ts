import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY が設定されていません");
  return new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "ログイン情報が不正です" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const baseUrl =
    process.env.VERCEL_ENV === "production"
      ? "https://excelcend.com"
      : appUrl || "https://excelcend.com";

  try {
    const stripe = getStripeClient();
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (!customers.data[0]) {
      return NextResponse.json({ error: "契約情報が見つかりません。先にプランをご契約ください。" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${baseUrl}/settings`,
      locale: "ja",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ポータルの作成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
