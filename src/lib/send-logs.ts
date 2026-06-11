type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type SendLogInsert = {
  user_id: string;
  company_name: string;
  to_email: string;
  subject: string;
  cc_emails?: string[] | null;
  pdf_path?: string | null;
  source_file_path?: string | null;
  status: "sent" | "failed";
};

type SupabaseLike = {
  from: (table: "send_logs") => {
    insert: (values: Omit<SendLogInsert, "cc_emails"> | SendLogInsert) => PromiseLike<{ error: SupabaseError | null }>;
  };
};

type QueryResult = PromiseLike<{ data: unknown; error: SupabaseError | null }>;

const CC_EMAILS_COLUMN = "cc_emails";

function isMissingCcEmailsColumnError(error: SupabaseError | null): boolean {
  if (!error) return false;

  const text = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();

  return (
    text.includes(CC_EMAILS_COLUMN) &&
    (text.includes("pgrst204") ||
      text.includes("42703") ||
      text.includes("could not find") ||
      text.includes("column") ||
      text.includes("schema cache"))
  );
}

function withoutCcEmails(log: SendLogInsert): Omit<SendLogInsert, "cc_emails"> {
  const { cc_emails: _ccEmails, ...fallbackLog } = log;
  return fallbackLog;
}

/**
 * Saves a send log while remaining compatible with environments where the
 * optional cc_emails migration has not been applied yet.
 */
export async function insertSendLog(
  supabase: SupabaseLike,
  log: SendLogInsert,
  context: string
): Promise<SupabaseError | null> {
  const { error } = await supabase.from("send_logs").insert(log);

  if (!error) return null;

  if (isMissingCcEmailsColumnError(error)) {
    console.error(
      `${context} send_logs insert failed because cc_emails is unavailable; retrying without cc_emails. Apply supabase/migrations/20260609000000_add_cc_emails_to_send_logs.sql to store CC recipients.`,
      error
    );

    const { error: fallbackError } = await supabase
      .from("send_logs")
      .insert(withoutCcEmails(log));

    if (fallbackError) {
      console.error(`${context} send_logs fallback insert error:`, fallbackError);
      return fallbackError;
    }

    return null;
  }

  console.error(`${context} send_logs insert error:`, error);
  return error;
}

/**
 * Selects send logs with cc_emails when available and falls back to the legacy
 * column set if a database has not run the cc_emails migration yet.
 */
export async function fetchSendLogsWithOptionalCc<T extends { cc_emails?: string[] | null }>(
  runQuery: (columns: string) => QueryResult,
  baseColumns: string,
  context: string
): Promise<{ data: T[]; error: SupabaseError | null }> {
  const columnsWithCc = `${baseColumns}, cc_emails`;
  const { data, error } = await runQuery(columnsWithCc);

  if (!error) return { data: (data as T[] | null) ?? [], error: null };

  if (!isMissingCcEmailsColumnError(error)) {
    console.error(`${context} send_logs fetch error:`, error);
    return { data: [], error };
  }

  console.error(
    `${context} send_logs fetch failed because cc_emails is unavailable; retrying without cc_emails. Apply supabase/migrations/20260609000000_add_cc_emails_to_send_logs.sql to display CC recipients.`,
    error
  );

  const { data: fallbackData, error: fallbackError } = await runQuery(baseColumns);

  if (fallbackError) {
    console.error(`${context} send_logs fallback fetch error:`, fallbackError);
    return { data: [], error: fallbackError };
  }

  const normalized = ((fallbackData as T[] | null) ?? []).map((log) => ({
    ...log,
    cc_emails: null,
  }));

  return { data: normalized, error: null };
}
