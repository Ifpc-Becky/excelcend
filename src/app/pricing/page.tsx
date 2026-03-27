import { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "プラン・料金 | ExcelCend",
  description: "ExcelCend のサブスクリプションプランを選択してください",
};

interface Props {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function PricingPage({ searchParams }: Props) {
  const params = await searchParams;

  // price_id はサーバー側で環境変数から渡す（クライアントに直接露出しない）
  const priceIdStarter  = process.env.STRIPE_PRICE_ID_STARTER  ?? "";
  const priceIdStandard = process.env.STRIPE_PRICE_ID_STANDARD ?? "";
  const priceIdBusiness = process.env.STRIPE_PRICE_ID_BUSINESS ?? "";

  return (
    <PricingClient
      priceIdStarter={priceIdStarter}
      priceIdStandard={priceIdStandard}
      priceIdBusiness={priceIdBusiness}
      checkoutStatus={params.checkout ?? null}
    />
  );
}
