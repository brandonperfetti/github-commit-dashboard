const FALLBACK_TIMEZONE = "UTC";

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function sanitizeTimezone(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return isValidTimezone(trimmed) ? trimmed : null;
}

export function getConfiguredActivityTimezone() {
  return (
    sanitizeTimezone(
      process.env.ACTIVITY_HEATMAP_TIMEZONE ??
        process.env.NEXT_PUBLIC_ACTIVITY_HEATMAP_TIMEZONE,
    ) ?? FALLBACK_TIMEZONE
  );
}
