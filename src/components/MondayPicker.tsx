"use client";

import { useMemo, useState } from "react";
import type { DeliverySettings } from "@/lib/types";
import { mondayState, parseISODate, todaySAST, toISODate, upcomingMondays } from "@/lib/delivery";
import { ChevronLeft, ChevronRight } from "./Icons";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Month calendar where only open delivery Mondays can be chosen.
 * Nothing is pre-selected: the customer must tap a date.
 */
export function MondayPicker({
  settings,
  value,
  onChange,
  invalid,
}: {
  settings: DeliverySettings;
  value: string | null;
  onChange: (iso: string) => void;
  invalid?: boolean;
}) {
  const today = todaySAST();
  const mondays = useMemo(() => upcomingMondays(settings.horizonWeeks), [settings.horizonWeeks]);
  const states = useMemo(() => new Map(mondays.map((m) => [m, mondayState(m, settings)])), [mondays, settings]);
  const firstOpen = mondays.find((m) => states.get(m) === "available");
  const start = parseISODate(value ?? firstOpen ?? today)!;
  const [ym, setYm] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() });

  const minYm = { y: parseISODate(today)!.getUTCFullYear(), m: parseISODate(today)!.getUTCMonth() };
  const last = parseISODate(mondays[mondays.length - 1])!;
  const maxYm = { y: last.getUTCFullYear(), m: last.getUTCMonth() };
  const cmp = (a: { y: number; m: number }, b: { y: number; m: number }) => a.y * 12 + a.m - (b.y * 12 + b.m);

  const first = new Date(Date.UTC(ym.y, ym.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first grid
  const daysInMonth = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(Date.UTC(ym.y, ym.m, d))));

  const move = (delta: number) =>
    setYm((c) => {
      const n = c.y * 12 + c.m + delta;
      return { y: Math.floor(n / 12), m: n % 12 };
    });

  const openCount = mondays.filter((m) => states.get(m) === "available").length;

  return (
    <div>
      <div className="cal" aria-invalid={invalid} style={invalid ? { borderColor: "var(--danger)" } : undefined}>
        <div className="cal-head">
          <button
            type="button"
            className="icon-btn"
            aria-label="Previous month"
            onClick={() => move(-1)}
            disabled={cmp(ym, minYm) <= 0}
            style={{ opacity: cmp(ym, minYm) <= 0 ? 0.25 : 1 }}
          >
            <ChevronLeft />
          </button>
          <strong aria-live="polite">
            {MONTHS[ym.m]} {ym.y}
          </strong>
          <button
            type="button"
            className="icon-btn"
            aria-label="Next month"
            onClick={() => move(1)}
            disabled={cmp(ym, maxYm) >= 0}
            style={{ opacity: cmp(ym, maxYm) >= 0 ? 0.25 : 1 }}
          >
            <ChevronRight />
          </button>
        </div>
        <div className="cal-grid" role="grid" aria-label="Choose a delivery Monday">
          {DOW.map((d, i) => (
            <div key={d} className={`cal-dow${i === 0 ? " mon" : ""}`} role="columnheader">
              {d}
            </div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e${i}`} />;
            const day = Number(iso.slice(8));
            const st = states.get(iso);
            const avail = st === "available";
            const blocked = st === "blocked";
            const selected = value === iso;
            const cls = ["cal-day", avail && "avail", blocked && "blocked", selected && "selected", iso === today && "today"]
              .filter(Boolean)
              .join(" ");
            const label = new Date(iso + "T00:00:00Z").toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            });
            const why = avail
              ? "available"
              : blocked
                ? "no delivery this Monday"
                : st === "closed"
                  ? "ordering closed"
                  : st === "beyond"
                    ? "not yet open"
                    : "no deliveries on this day";
            return (
              <button
                key={iso}
                type="button"
                className={cls}
                disabled={!avail}
                aria-pressed={selected}
                aria-label={`${label}, ${why}`}
                onClick={() => onChange(iso)}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="cal-legend">
          <span>
            <i /> Available Monday
          </span>
          <span>
            <i className="sel" /> Selected
          </span>
          <span style={{ textDecoration: "line-through" }}>12</span>
          <span style={{ marginLeft: -10 }}>No delivery</span>
        </div>
      </div>
      {openCount === 0 && (
        <p className="notice notice-warn small" style={{ marginTop: 12, maxWidth: 420 }}>
          There are no open delivery Mondays right now. Please check back soon or contact us on WhatsApp.
        </p>
      )}
    </div>
  );
}
