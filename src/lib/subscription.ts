import Stripe from "stripe";

export type SubscriptionPlan = "未契約" | "Starter" | "Standard" | "Business";

interface CurrentSubscriptionPlan {
  name: SubscriptionPlan;
  isSubscribed: boolean;
}

const UNCONTRACTED_PLAN: CurrentSubscriptionPlan = {
  name: "未契約",
  isSubscribed: false,
};

const priceIdToPlan: Record<string, Exclude<SubscriptionPlan, "未契約"> | undefined> = {
  ...(process.env.STRIPE_PRICE_ID_STARTER
    ? { [process.env.STRIPE_PRICE_ID_STARTER]: "Starter" as const }
    : {}),
  ...(process.env.STRIPE_PRICE_ID_STANDARD
    ? { [process.env.STRIPE_PRICE_ID_STANDARD]: "Standard" as const }
    : {}),
  ...(process.env.STRIPE_PRICE_ID_BUSINESS
    ? { [process.env.STRIPE_PRICE_ID_BUSINESS]: "Business" as const }
    : {}),
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  });
}

function planFromSubscription(subscription: Stripe.Subscription): CurrentSubscriptionPlan {
  const plan = subscription.items.data
    .map((item) => priceIdToPlan[item.price.id])
    .find((name): name is Exclude<SubscriptionPlan, "未契約"> => Boolean(name));

  if (!plan) return UNCONTRACTED_PLAN;

  return {
    name: plan,
    isSubscribed: true,
  };
}

export async function getCurrentSubscriptionPlan(
  userId: string,
  userEmail?: string | null
): Promise<CurrentSubscriptionPlan> {
  const stripe = getStripeClient();
  if (!stripe || !userEmail) return UNCONTRACTED_PLAN;

  try {
    const customers = await stripe.customers.list({ email: userEmail, limit: 100 });

    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 100,
      });

      const matchingSubscription = subscriptions.data.find((subscription) => {
        const metadataUserId = subscription.metadata?.supabase_user_id;
        return !metadataUserId || metadataUserId === userId;
      });

      if (matchingSubscription) {
        return planFromSubscription(matchingSubscription);
      }
    }
  } catch (error) {
    console.error("[subscription] Stripe subscription fetch error:", error);
  }

  return UNCONTRACTED_PLAN;
}
