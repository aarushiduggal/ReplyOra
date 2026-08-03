import type { BusinessHours, TimeSlot } from "@/lib/data/types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Pure slot generator from opening hours — safe on both server and client.
 * The dashboard accessor and the widget's inline booking flow both use this.
 */
export function generateSlots(
  hours: BusinessHours,
  from: Date = new Date(),
  days = 7,
  perDay = 4,
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(from);
    date.setDate(from.getDate() + d);
    const key = DAY_KEYS[date.getDay()]!;
    const h = hours[key];
    if (!h || h.closed || !h.open) continue;

    const openHour = Number(h.open.split(":")[0]);
    const closeHour = Number((h.close || "17:00").split(":")[0]);
    const startHours = [openHour + 1, openHour + 3, openHour + 5, openHour + 7];

    for (const hr of startHours.slice(0, perDay)) {
      if (hr >= closeHour) continue;
      const slot = new Date(date);
      slot.setHours(hr, 0, 0, 0);
      if (slot.getTime() <= from.getTime()) continue;
      slots.push({ start: slot.toISOString(), label: formatSlot(slot) });
    }
  }
  return slots;
}

export function formatSlot(d: Date): string {
  return d.toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
