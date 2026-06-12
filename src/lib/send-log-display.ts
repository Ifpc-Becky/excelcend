export const SEND_LOG_TIME_ZONE = "Asia/Tokyo";

type FormatSendLogDateOptions = {
  includeYear?: boolean;
};

function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatSendLogDate(
  iso: string,
  { includeYear = true }: FormatSendLogDateOptions = {}
): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: SEND_LOG_TIME_ZONE,
    year: includeYear ? "numeric" : undefined,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  const hour = getDatePart(parts, "hour");
  const minute = getDatePart(parts, "minute");

  if (!month || !day || !hour || !minute) {
    return "";
  }

  if (!includeYear) {
    return `${month}/${day} ${hour}:${minute}`;
  }

  const year = getDatePart(parts, "year");
  return year ? `${year}/${month}/${day} ${hour}:${minute}` : "";
}

function normalizeEmailItems(items: unknown[]): string[] {
  return items
    .filter((email): email is string => typeof email === "string")
    .map((email) => email.trim())
    .filter(Boolean);
}

function parsePostgresTextArray(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;

  return normalizeEmailItems(
    trimmed
      .slice(1, -1)
      .split(",")
      .map((email) => email.trim().replace(/^"|"$/g, ""))
  );
}

function parseJsonArrayString(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? normalizeEmailItems(parsed) : null;
  } catch {
    return null;
  }
}

export function normalizeCcEmails(ccEmails: unknown): string[] {
  if (Array.isArray(ccEmails)) {
    return normalizeEmailItems(ccEmails);
  }

  if (typeof ccEmails === "string") {
    const parsedJsonArray = parseJsonArrayString(ccEmails);
    if (parsedJsonArray) return parsedJsonArray;

    const parsedPostgresArray = parsePostgresTextArray(ccEmails);
    if (parsedPostgresArray) return parsedPostgresArray;

    return normalizeEmailItems(ccEmails.split(/[\n,;]/));
  }

  if (ccEmails && typeof ccEmails === "object") {
    const record = ccEmails as Record<string, unknown>;
    return normalizeCcEmails(record.cc_emails ?? record.ccEmails ?? record.emails);
  }

  return [];
}
