-- =============================================
-- ExcelCend — Supabase Storage セットアップ
-- Supabase SQL Editorで実行してください
-- =============================================

-- source-files バケットを作成（非公開）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'source-files',
  'source-files',
  false,                          -- 非公開バケット（署名付きURLが必要）
  20971520,                       -- 20MB 上限
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream'    -- 一部ブラウザのfallback MIME
  ]
)
on conflict (id) do nothing;

-- =============================================
-- RLSポリシー（自分のフォルダのみ操作可）
-- =============================================

-- アップロード（INSERT）
create policy "users can upload own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'source-files'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 閲覧（SELECT）
create policy "users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'source-files'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 削除（DELETE）
create policy "users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'source-files'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = auth.uid()::text
);
