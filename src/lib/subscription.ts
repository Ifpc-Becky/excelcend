import Stripe from "stripe";

export type SubscriptionPlan = "Free" | "Starter" | "Standard" | "Business";

export const MONTHLY_EMAIL_LIMITS: Record<SubscriptionPlan, number | null> = {
  Free: 10,
  Starter: 30,
  Standard: 100,
  Business: null,
};

export function getMonthlyEmailLimit(plan: SubscriptionPlan): number | null {
  return MONTHLY_EMAIL_LIMITS[plan];
}

export const CUSTOMER_LIMITS: Record<SubscriptionPlan, number | null> = {
  Free: 5,
  Starter: 50,
  Standard: null,
  Business: null,
};

export function canUseStandardFeatures(plan: SubscriptionPlan): boolean {
  return plan === "Standard" || plan === "Business";
}

export function getCustomerLimit(plan: SubscriptionPlan): number | null {
  return CUSTOMER_LIMITS[plan];
}

export function isCustomerLimitReached(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = getCustomerLimit(plan);
  return limit !== null && currentCount >= limit;
}

interface CurrentSubscriptionPlan {
  name: SubscriptionPlan;
  isSubscribed: boolean;
}

const FREE_PLAN: CurrentSubscriptionPlan = {
  name: "Free",
  isSubscribed: false,
};

const priceIdToPlan: Record<string, Exclude<SubscriptionPlan, "Free"> | undefined> = {
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
    .find((name): name is Exclude<SubscriptionPlan, "Free"> => Boolean(name));

  if (!plan) return FREE_PLAN;

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
  if (!stripe || !userEmail) return FREE_PLAN;

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

  return FREE_PLAN;
}
