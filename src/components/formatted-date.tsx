"use client";

import { useSyncExternalStore } from "react";

function noopSubscribe() {
  return () => {};
}

function isoMinutes(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function localDateTime(date: Date) {
  return date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

// The server and the browser can disagree on locale/timezone, so the locale-formatted
// value is only used once we know we're rendering on the client (useSyncExternalStore's
// server snapshot keeps SSR/hydration output stable and avoids a hydration mismatch).
export function FormattedDate({ date }: { date: Date }) {
  const formatted = useSyncExternalStore(
    noopSubscribe,
    () => localDateTime(date),
    () => isoMinutes(date)
  );

  return <>{formatted}</>;
}
