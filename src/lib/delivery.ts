import type { DeliverySettings } from "./types";

// South Africa (SAST) is UTC+2 all year, no daylight saving.
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Current date in SAST as YYYY-MM-DD. */
export function todaySAST(now: Date = new Date()): string {
  return new Date(now.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Parse YYYY-MM-DD into a UTC-midnight Date (used purely for calendar maths). */
export function parseISODate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
  return d;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isMonday(iso: string): boolean {
  const d = parseISODate(iso);
  return !!d && d.getUTCDay() === 1;
}

/** Moment (as epoch ms) when ordering for the given Monday closes. */
export function cutoffFor(iso: string, cutoffHours: number): number {
  const d = parseISODate(iso)!;
  // Monday 00:00 SAST = Sunday 22:00 UTC
  const mondayStartUtc = d.getTime() - SAST_OFFSET_MS;
  return mondayStartUtc - cutoffHours * 60 * 60 * 1000;
}

export type MondayState = "available" | "blocked" | "closed" | "beyond";

/** Why a given Monday can or can't be chosen. */
export function mondayState(
  iso: string,
  s: Pick<DeliverySettings, "cutoffHours" | "horizonWeeks" | "blockedDates">,
  now: Date = new Date(),
): MondayState {
  if (now.getTime() >= cutoffFor(iso, s.cutoffHours)) return "closed";
  const today = parseISODate(todaySAST(now))!;
  const d = parseISODate(iso)!;
  const days = (d.getTime() - today.getTime()) / 86400000;
  if (days > s.horizonWeeks * 7) return "beyond";
  if (s.blockedDates.includes(iso)) return "blocked";
  return "available";
}

/** All Mondays from this week up to the booking horizon (inclusive). */
export function upcomingMondays(horizonWeeks: number, now: Date = new Date()): string[] {
  const today = parseISODate(todaySAST(now))!;
  const dow = today.getUTCDay();
  const offset = (1 - dow + 7) % 7;
  const first = new Date(today.getTime() + offset * 86400000);
  const out: string[] = [];
  for (let i = 0; i <= horizonWeeks; i++) {
    out.push(toISODate(new Date(first.getTime() + i * 7 * 86400000)));
  }
  return out;
}

export function availableMondays(s: DeliverySettings, now: Date = new Date()): string[] {
  return upcomingMondays(s.horizonWeeks, now).filter((d) => mondayState(d, s, now) === "available");
}

export function isDeliverableDate(iso: string, s: DeliverySettings, now: Date = new Date()): boolean {
  return isMonday(iso) && mondayState(iso, s, now) === "available";
}

const longFmt = new Intl.DateTimeFormat("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "Monday, 30 November 2026" */
export function formatDeliveryDate(iso: string): string {
  const d = parseISODate(iso);
  return d ? longFmt.format(d) : iso;
}

export function deliveryFeeFor(subtotalCents: number, s: DeliverySettings): number {
  if (subtotalCents <= 0) return 0;
  if (s.freeOverCents != null && subtotalCents >= s.freeOverCents) return 0;
  return s.feeCents;
}

export function normaliseSuburb(v: string): string {
  return v.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSupportedSuburb(suburb: string, s: DeliverySettings): boolean {
  const n = normaliseSuburb(suburb);
  return s.regions.some((r) => normaliseSuburb(r) === n);
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Saturday at 12:00" for a cutoff of 36 hours before Monday 00:00. */
export function describeCutoff(cutoffHours: number): string {
  if (cutoffHours <= 0) return "Sunday at midnight";
  const minutesBefore = cutoffHours * 60;
  const total = 7 * 24 * 60; // minutes from Monday 00:00 back through the week
  const m = ((-minutesBefore % total) + total) % total; // minutes after Monday 00:00
  const day = DAYS[(1 + Math.floor(m / 1440)) % 7];
  const hh = String(Math.floor((m % 1440) / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${day} at ${hh}:${mm}`;
}
