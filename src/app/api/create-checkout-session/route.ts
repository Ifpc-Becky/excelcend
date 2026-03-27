import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// 許可されたPrice IDのホワイトリスト（環境変数から構築）
function getAllowedPriceIds(): Set<string> {
  return new Set(
    [
      process.env.STRIPE_PRICE_ID_STARTER,
      process.env.STRIPE_PRICE_ID_STANDARD,
      process.env.STRIPE_PRICE_ID_BUSINESS,
    ].filter(Boolean) as string[]
  );
}

export async function POST(req: NextRequest) {
  // ① ログインユーザー確認
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "ログインしていません" },
      { status: 401 }
    );
  }

  // ② リクエストボディ取得
  let priceId: string;
  try {
    const body = await req.json();
    priceId = (body.priceId ?? "").trim();
    if (!priceId) throw new Error("priceId is required");
  } catch {
    return NextResponse.json(
      { error: "priceId が指定されていません" },
      { status: 400 }
    );
  }

  // ③ priceId ホワイトリスト検証（不正な price_id を弾く）
  const allowedIds = getAllowedPriceIds();
  if (allowedIds.size > 0 && !allowedIds.has(priceId)) {
    return NextResponse.json(
      { error: "無効な priceId です" },
      { status: 400 }
    );
  }

  // ④ ベースURL取得
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    `https://${req.headers.get("host")}`;

  // ⑤ Stripe Checkout Session 作成
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price:    priceId,
          quantity: 1,
        },
      ],
      // ログインユーザーのメールをプリフィルして入力を省略
      customer_email: user.email,
      // Supabase user_id を metadata に保存（Webhook での照合用）
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url:  `${baseUrl}/pricing?checkout=cancelled`,
      locale: "ja",
    });

    if (!session.url) {
      throw new Error("Stripe から Checkout URL を取得できませんでした");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe エラーが発生しました";
    console.error("[create-checkout-session] Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
