-- =============================================
-- ExcelCend — send_logs テーブル
-- Supabase SQL Editor で実行してください
-- =============================================

create table if not exists public.send_logs (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  company_name    text        not null,
  to_email        text        not null,
  subject         text        not null,
  pdf_path        text,
  source_file_path text,
  status          text        not null default 'sent',
  created_at      timestamptz not null default now()
);

-- RLS 有効化
alter table public.send_logs enable row level security;

-- 自分のログのみ閲覧可
create policy "users can view own send logs"
  on public.send_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 自分のログのみ挿入可
create policy "users can insert own send logs"
  on public.send_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- =============================================
-- インデックス（一覧取得を高速化）
-- =============================================
create index if not exists send_logs_user_id_created_at_idx
  on public.send_logs (user_id, created_at desc);
