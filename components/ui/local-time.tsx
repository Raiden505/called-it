"use client";

import { useSyncExternalStore } from "react";

type LocalTimeProps = { date: string; mode?: "time" | "datetime" | "match"; className?: string };

function formatDate(date: string, timeZone: string | undefined, mode: LocalTimeProps["mode"] = "time") {
  const options = mode === "match"
    ? { weekday: "short" as const, month: "short" as const, day: "numeric" as const, hour: "numeric" as const, minute: "2-digit" as const, timeZone, timeZoneName: "short" as const }
    : mode === "datetime"
      ? { dateStyle: "medium" as const, timeStyle: "short" as const, timeZone }
      : { hour: "numeric" as const, minute: "2-digit" as const, timeZone, timeZoneName: "short" as const };
  return new Intl.DateTimeFormat(undefined, options).format(new Date(date));
}

export function LocalTime({ date, mode = "time", className }: LocalTimeProps) {
  const label = useSyncExternalStore(() => () => undefined, () => formatDate(date, undefined, mode), () => formatDate(date, "UTC", mode));
  return <time className={className} dateTime={date} title={new Date(date).toISOString()}>{label}</time>;
}
