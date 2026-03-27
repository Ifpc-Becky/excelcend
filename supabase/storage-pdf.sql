-- =============================================
-- ExcelCend — pdf-files バケット セットアップ
-- Supabase SQL Editorで実行してください
-- =============================================

-- pdf-files バケットを作成（非公開）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pdf-files',
  'pdf-files',
  false,
  52428800,                        -- 50MB 上限
  array['application/pdf']
)
on conflict (id) do nothing;

-- =============================================
-- RLSポリシー（自分の pdf/ フォルダのみ）
-- =============================================

-- アップロード（INSERT） — APIサーバーから service_role で書き込むため
-- anon/authenticated 両方を許可する場合は以下を有効化
create policy "users can upload own pdfs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pdf-files'
  and (storage.foldername(name))[1] = 'pdf'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 閲覧（SELECT）
create policy "users can view own pdfs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pdf-files'
  and (storage.foldername(name))[1] = 'pdf'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 削除（DELETE）
create policy "users can delete own pdfs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pdf-files'
  and (storage.foldername(name))[1] = 'pdf'
  and (storage.foldername(name))[2] = auth.uid()::text
);
