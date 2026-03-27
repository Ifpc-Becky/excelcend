-- =============================================
-- ExcelCend — mail_templates テーブル
-- Supabase SQL Editor で実行してください
-- =============================================

create table if not exists public.mail_templates (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  template_name    text        not null default 'default',
  subject_template text,
  body_template    text        not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RLS 有効化
alter table public.mail_templates enable row level security;

create policy "users can view own templates"
  on public.mail_templates for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert own templates"
  on public.mail_templates for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update own templates"
  on public.mail_templates for update
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own templates"
  on public.mail_templates for delete
  to authenticated
  using (auth.uid() = user_id);

-- ユーザーごとにテンプレート名を一意にする
create unique index if not exists mail_templates_user_template_name_key
  on public.mail_templates (user_id, template_name);

-- updated_at 自動更新トリガー
create or replace function update_mail_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger mail_templates_updated_at
  before update on public.mail_templates
  for each row execute function update_mail_templates_updated_at();
