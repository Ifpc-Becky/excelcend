-- ExcelCend MVP スキーマ
-- Supabase SQL Editorで実行してください

-- 顧客テーブル
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text not null,
  contact_name text,
  email text not null,
  phone text,
  address text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 送信ログテーブル
create table if not exists public.send_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  subject text not null,
  recipient_email text not null,
  recipient_company text,
  amount integer, -- 金額（円）
  status text check (status in ('pending', 'delivered', 'failed')) default 'pending',
  file_name text,
  pdf_path text,
  error_message text,
  sent_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- RLS（行レベルセキュリティ）有効化
alter table public.customers enable row level security;
alter table public.send_logs enable row level security;

-- ポリシー: 自分のデータのみ操作可能
create policy "customers: own data only" on public.customers
  for all using (auth.uid() = user_id);

create policy "send_logs: own data only" on public.send_logs
  for all using (auth.uid() = user_id);

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on public.customers
  for each row execute function update_updated_at();
