import { PILLARS, type Platform } from "./types";

/**
 * ReplyOra Social — month planner.
 *
 * Turns "a month, this often, these pillars" into concrete dated slots. Pure
 * functions only: no DB, no clock, no randomness — every input is passed in, so
 * the same arguments always produce the same plan. That keeps it trivially
 * testable and means the server and the client can compute the same preview.
 *
 * The generator (generate.ts) fills these slots with captions; nothing here
 * knows or cares how the words get written.
 */

/** How many posts a week the client wants. */
export type Cadence = 2 | 3 | 5 | 7;

export const CADENCES: { value: Cadence; label: string; hint: string }[] = [
  { value: 2, label: "2× a week", hint: "~8 posts a month · steady presence" },
  { value: 3, label: "3× a week", hint: "~13 posts a month · recommended" },
  { value: 5, label: "5× a week", hint: "~21 posts a month · weekdays" },
  { value: 7, label: "Daily", hint: "~30 posts a month · high output" },
];

/** Which weekdays each cadence uses (0 = Sunday … 6 = Saturday). */
const CADENCE_DAYS: Record<Cadence, number[]> = {
  2: [2, 4], // Tue, Thu
  3: [1, 3, 5], // Mon, Wed, Fri
  5: [1, 2, 3, 4, 5], // weekdays
  7: [0, 1, 2, 3, 4, 5, 6],
};

export interface PlannedSlot {
  /** ISO date-time for the post, e.g. 2026-09-03T18:00:00.000Z */
  scheduledFor: string;
  /** Human day label for the review UI, e.g. "Wed 3 Sep". */
  dayLabel: string;
  /** Wall-clock time as planned, e.g. "18:00". */
  timeLabel: string;
  pillar: string;
  platform: Platform;
  /** Position in the month, 1-based — used for stable keys and ordering. */
  index: number;
}

export interface PlanMonthInput {
  /** Year and 0-based month to fill (matches Date semantics). */
  year: number;
  month: number;
  cadence: Cadence;
  /** Pillars to rotate through. Falls back to all PILLARS when empty. */
  pillars: string[];
  platform: Platform;
  /** Preferred posting times as "HH:MM" strings, cycled across slots. */
  times: string[];
  /**
   * Only plan dates on or after this ISO date (so "this month" starting today
   * doesn't schedule into the past). Omit to fill the whole month.
   */
  notBefore?: string;
  /** Hard ceiling on slots, so a daily cadence can't run away. */
  max?: number;
  /**
   * The agency's UTC offset in MINUTES EAST (Sydney = +600), i.e.
   * `-new Date().getTimezoneOffset()` in the browser.
   *
   * This must be passed explicitly. Building dates with `new Date(y, m, d, h)`
   * uses the *server's* zone, and Netlify runs in UTC — so "9am" planned by a
   * Sydney agency would have been stored as 9am UTC and published at 7pm their
   * time. Times are civil (wall-clock) values; this is what anchors them.
   */
  tzOffsetMinutes?: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DEFAULT_TIMES = ["09:00", "12:30", "18:00"];

/**
 * Normalise posting times to "HH:MM".
 *
 * computeRecommendedTimes() returns audience-facing labels ("Tue 7pm", "Sun
 * 11am"), not clock times. We want the HOUR from those — that's the real signal
 * about when followers are online — while the cadence decides which weekday.
 * Anything unparseable is dropped rather than silently becoming 09:00.
 */
export function toClockTimes(labels: string[]): string[] {
  const out: string[] = [];
  for (const raw of labels) {
    const s = raw.trim();

    const hhmm = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (hhmm) {
      const h = Number(hhmm[1]);
      const m = Number(hhmm[2]);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
      continue;
    }

    const meridiem = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(s);
    if (meridiem) {
      let h = Number(meridiem[1]);
      const m = Number(meridiem[2] ?? 0);
      const pm = meridiem[3]!.toLowerCase() === "pm";
      if (h === 12) h = 0;
      if (pm) h += 12;
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
  }
  return Array.from(new Set(out));
}

/**
 * A natural subject per pillar. The generator drops `topic` straight into the
 * copy, so it has to read like something a person would say — "educational
 * content for Bloom Hair Studio" does not.
 */
export const PILLAR_TOPICS: Record<string, string> = {
  Educational: "how we actually do what we do",
  Promotion: "booking your next appointment",
  Testimonial: "what our clients say afterwards",
  "Behind the scenes": "a normal day with the team",
  Tips: "getting the most out of your visit",
  Offer: "this month's offer",
};

/**
 * Build the dated slots for one month.
 *
 * Pillars rotate round-robin so a month never lands as six Promotion posts in a
 * row, and times cycle independently of pillars so the two patterns don't lock
 * in step with each other.
 */
export function planMonth(input: PlanMonthInput): PlannedSlot[] {
  const pillars = input.pillars.length > 0 ? input.pillars : [...PILLARS];
  const times = input.times.length > 0 ? input.times : DEFAULT_TIMES;
  const days = CADENCE_DAYS[input.cadence];
  const max = input.max ?? 31;

  const offsetMs = (input.tzOffsetMinutes ?? 0) * 60_000;
  const floorMs = input.notBefore ? new Date(input.notBefore).getTime() : null;
  const slots: PlannedSlot[] = [];

  // Day 0 of the NEXT month is the last day of this one. Computed in UTC so the
  // month length never shifts with the server's zone.
  const daysInMonth = new Date(Date.UTC(input.year, input.month + 1, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth && slots.length < max; day++) {
    // Civil weekday — derived in UTC so it's the calendar's weekday, not the
    // server's interpretation of it.
    const weekday = new Date(Date.UTC(input.year, input.month, day)).getUTCDay();
    if (!days.includes(weekday)) continue;

    const i = slots.length;
    const time = times[i % times.length] ?? DEFAULT_TIMES[0]!;
    const [hhRaw, mmRaw] = time.split(":").map((n) => Number(n));
    const hh = Number.isFinite(hhRaw) ? hhRaw! : 9;
    const mm = Number.isFinite(mmRaw) ? mmRaw! : 0;

    // Wall-clock time in the agency's zone → the actual instant.
    const whenMs = Date.UTC(input.year, input.month, day, hh, mm) - offsetMs;

    // Skip anything already in the past — you can't schedule backwards.
    if (floorMs !== null && whenMs < floorMs) continue;

    slots.push({
      scheduledFor: new Date(whenMs).toISOString(),
      dayLabel: `${DAY_NAMES[weekday]} ${day} ${MONTH_NAMES[input.month]}`,
      /** Wall-clock time as planned, for the review UI. */
      timeLabel: time,
      pillar: pillars[i % pillars.length]!,
      platform: input.platform,
      index: slots.length + 1,
    });
  }

  return slots;
}

/** Human summary of a plan, for the confirm step ("13 posts · Mon/Wed/Fri"). */
export function describePlan(slots: PlannedSlot[], cadence: Cadence): string {
  if (slots.length === 0) return "No dates left in this month";
  const dayNames = CADENCE_DAYS[cadence].map((d) => DAY_NAMES[d]).join("/");
  return `${slots.length} post${slots.length === 1 ? "" : "s"} · ${dayNames}`;
}
