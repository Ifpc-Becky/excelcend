import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient, { type MailTemplate } from "./SettingsClient";
import {
  DEFAULT_SUBJECT_TEMPLATE,
  DEFAULT_BODY_TEMPLATE,
} from "@/app/api/mail-templates/route";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // default テンプレートを取得（未存在なら upsert して返す）
  let template: MailTemplate;

  const { data: existing } = await supabase
    .from("mail_templates")
    .select("id, template_name, subject_template, body_template, updated_at")
    .eq("user_id", user.id)
    .eq("template_name", "default")
    .maybeSingle();

  if (existing) {
    template = existing;
  } else {
    // 初回: デフォルトを自動作成
    const { data: created } = await supabase
      .from("mail_templates")
      .insert({
        user_id:          user.id,
        template_name:    "default",
        subject_template: DEFAULT_SUBJECT_TEMPLATE,
        body_template:    DEFAULT_BODY_TEMPLATE,
      })
      .select("id, template_name, subject_template, body_template, updated_at")
      .single();

    template = created ?? {
      id:               null,
      template_name:    "default",
      subject_template: DEFAULT_SUBJECT_TEMPLATE,
      body_template:    DEFAULT_BODY_TEMPLATE,
      updated_at:       null,
    };
  }

  return <SettingsClient initialTemplate={template} />;
}
