import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-02-24.acacia";
const THANK_YOU_SUBJECT = "ExcelCendのご契約ありがとうございます";
const FROM_ADDRESS = "ExcelCend <noreply@excelcend.com>";

const UPLOAD_URL = "https://excelcend.com/upload";
const LOGIN_URL = "https://excelcend.com/auth/login";
const SETTINGS_URL = "https://excelcend.com/settings";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY が設定されていません");
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

function buildThankYouText(companyName?: string): string {
  const salutation = companyName ? `${companyName} 様` : "ご担当者様";

  return `${salutation}

ExcelCendをご契約いただきありがとうございます。

決済が完了し、ご契約プランでのご利用を開始できる状態になりました。

Excel請求書をアップロードするだけで、PDF化からメール送信までをかんたんに行えます。

請求書をアップロードする：
${UPLOAD_URL}

ログインはこちら：
${LOGIN_URL}

プランやお支払い情報の確認：
${SETTINGS_URL}

ご不明点がありましたら、support@excelcend.com までお気軽にお問い合わせください。

ExcelCend`;
}

function buildThankYouHtml(companyName?: string): string {
  const salutation = companyName ? `${companyName} 様` : "ご担当者様";

  return `
  <div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 32px; color: #1e293b; background: #ffffff;">
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 18px;">${salutation}</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 12px;">ExcelCendをご契約いただきありがとうございます。</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 12px;">決済が完了し、ご契約プランでのご利用を開始できる状態になりました。</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 24px;">Excel請求書をアップロードするだけで、PDF化からメール送信までをかんたんに行えます。</p>

    <a href="${UPLOAD_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:11px 22px; border-radius:8px; margin:0 8px 12px 0;">請求書をアップロードする</a>
    <a href="${LOGIN_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:11px 22px; border-radius:8px; margin:0 8px 12px 0;">ログインする</a>
    <a href="${SETTINGS_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#2563eb; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:11px 22px; border-radius:8px; margin:0 0 24px 0;">設定を確認する</a>

    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0 0 24px;">ご不明点がありましたら、support@excelcend.com までお気軽にお問い合わせください。</p>
    <p style="font-size:14px; color:#475569; line-height:1.8; margin:0;">ExcelCend</p>
  </div>`;
}

async function sendSubscriptionThankYouEmail({
  email,
  companyName,
}: {
  email: string;
  companyName?: string;
}) {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [email],
    subject: THANK_YOU_SUBJECT,
    text: buildThankYouText(companyName),
    html: buildThankYouHtml(companyName),
  });

  if (error) throw error;
}

async function processSubscriptionEvent(subscription: Stripe.Subscription) {
  if (!["active", "trialing"].includes(subscription.status)) return;

  const stripe = getStripeClient();
  const freshSubscription = await stripe.subscriptions.retrieve(subscription.id);

  if (freshSubscription.metadata?.thank_you_email_sent_at) return;

  const customer = await stripe.customers.retrieve(freshSubscription.customer as string);
  if (customer.deleted) return;

  const email = customer.email?.trim();
  if (!email) return;

  const companyName = customer.name?.trim() || undefined;

  try {
    await sendSubscriptionThankYouEmail({ email, companyName });

    await stripe.subscriptions.update(freshSubscription.id, {
      metadata: {
        ...freshSubscription.metadata,
        thank_you_email_sent_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[stripe-webhook] thank-you email send error:", error);
  }
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook設定が不足しています" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed:", error);
    return NextResponse.json({ error: "署名検証に失敗しました" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          await processSubscriptionEvent(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await processSubscriptionEvent(subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe-webhook] event handling error:", error);
  }

  return NextResponse.json({ received: true });
}
