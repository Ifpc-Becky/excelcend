-- =============================================
-- ExcelCend — customers テーブル
-- Supabase SQL Editor で実行してください
-- =============================================

create table if not exists public.customers (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  company_name text        not null,
  email        text        not null,
  contact_name text,
  notes        text,
  created_at   timestamptz not null default now()
);

-- RLS 有効化
alter table public.customers enable row level security;

-- 自分の顧客のみ閲覧
create policy "users can view own customers"
  on public.customers for select
  to authenticated
  using (auth.uid() = user_id);

-- 自分の顧客のみ追加
create policy "users can insert own customers"
  on public.customers for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 自分の顧客のみ更新
create policy "users can update own customers"
  on public.customers for update
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 自分の顧客のみ削除
create policy "users can delete own customers"
  on public.customers for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- インデックス（一覧取得・重複チェックを高速化）
-- =============================================
create index if not exists customers_user_id_created_at_idx
  on public.customers (user_id, created_at desc);

-- 同一ユーザー内での company_name + email 重複チェック用
create unique index if not exists customers_user_company_email_idx
  on public.customers (user_id, company_name, email);
