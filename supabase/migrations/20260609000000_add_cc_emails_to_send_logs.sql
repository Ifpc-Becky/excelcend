-- Add optional CC recipients to invoice send logs.
alter table public.send_logs
  add column if not exists cc_emails text[];
