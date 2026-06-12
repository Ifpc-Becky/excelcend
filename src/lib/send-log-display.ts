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

export function normalizeCcEmails(ccEmails: unknown): string[] {
  if (Array.isArray(ccEmails)) {
    return ccEmails
      .filter((email): email is string => typeof email === "string")
      .map((email) => email.trim())
      .filter(Boolean);
  }

  if (typeof ccEmails === "string") {
    return ccEmails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }

  return [];
}
