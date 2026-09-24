const TIME_ZONE = "Asia/Manila";

export function formatManilaDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    ...options,
  }).format(new Date(value));
}

export function formatManilaDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatManilaTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    timeStyle: "short",
  }).format(new Date(value));
}
