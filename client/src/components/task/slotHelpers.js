export function parseDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function formatTimeOnly(timeStr) {
  const d = parseDateTime("2000-01-01", timeStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getHourFromTime(timeStr) {
  return parseInt(timeStr.split(":")[0], 10);
}

export function getAmPm(hour) {
  return hour >= 12 ? "PM" : "AM";
}

export function isPastSlot(dateStr, timeStr) {
  const now = new Date();
  const slot = parseDateTime(dateStr, timeStr);
  return slot < now;
}

export function getTomorrow() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
}

export const C = {
  primary: "#00346f",
  primaryFixed: "#d7e2ff",
  primaryContainer: "#004a99",
  onPrimary: "#ffffff",
  onPrimaryFixed: "#001b3f",
  secondary: "#466270",
  secondaryContainer: "#c6e4f4",
  onSecondaryContainer: "#4a6774",
  tertiary: "#003e28",
  tertiaryContainer: "#00573a",
  onTertiaryContainer: "#41d499",
  surface: "#f7f9fb",
  surfaceBright: "#f7f9fb",
  surfaceContainer: "#eceef0",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#e6e8ea",
  surfaceContainerHighest: "#e0e3e5",
  surfaceVariant: "#e0e3e5",
  onSurface: "#191c1e",
  onSurfaceVariant: "#424751",
  onBackground: "#191c1e",
  background: "#f7f9fb",
  outline: "#737783",
  outlineVariant: "#c2c6d3",
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
};