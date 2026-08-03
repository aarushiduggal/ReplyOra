"use client";

import { useState } from "react";
import { CalendarClock, CalendarPlus, Check, Clock, Link2 } from "lucide-react";

import { createBooking, updateBookingConfig } from "@/lib/data/actions";
import type { BookingConfig } from "@/lib/data/booking-config";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { Booking, BookingStatus, Lead, TimeSlot } from "@/lib/data/types";

const STATUS_VARIANT: Record<
  BookingStatus,
  "success" | "muted" | "danger"
> = {
  confirmed: "success",
  completed: "muted",
  cancelled: "danger",
};

export function BookingsView({
  initialBookings,
  slots,
  config,
  leads,
}: {
  initialBookings: Booking[];
  slots: TimeSlot[];
  config: BookingConfig;
  leads: Lead[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [creating, setCreating] = useState(false);

  const now = Date.now();
  const upcoming = bookings
    .filter((b) => new Date(b.start).getTime() >= now && b.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));
  const past = bookings
    .filter((b) => new Date(b.start).getTime() < now || b.status === "cancelled")
    .sort((a, b) => b.start.localeCompare(a.start));

  async function handleCreate(input: {
    customerName: string;
    customerEmail: string;
    service: string;
    start: string;
    leadId: string | null;
  }) {
    const booking = await createBooking(input);
    setBookings((prev) => [...prev, booking]);
    setCreating(false);
    // Owner alert — in-app toast now; email/SMS/push stubbed in the seam.
    toast({
      title: "Booking confirmed",
      body: input.leadId
        ? `${booking.customerName} · lead marked Booked`
        : `${booking.customerName} · ${booking.service}`,
      type: "booking",
    });
  }

  return (
    <div className="space-y-6">
      <BookingSetup config={config} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {upcoming.length} upcoming · {past.length} past
        </p>
        <Button onClick={() => setCreating((c) => !c)}>
          <CalendarPlus className="h-4 w-4" />
          New booking
        </Button>
      </div>

      {creating && (
        <NewBookingForm slots={slots} leads={leads} onCreate={handleCreate} />
      )}

      <Section title="Upcoming" bookings={upcoming} statusVariant={STATUS_VARIANT} empty="No upcoming bookings." />
      <Section title="Past" bookings={past} statusVariant={STATUS_VARIANT} empty="No past bookings." />
    </div>
  );
}

function BookingSetup({ config }: { config: BookingConfig }) {
  const [source, setSource] = useState<BookingConfig["source"]>(config.source);
  const [url, setUrl] = useState(config.externalUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function save(next: BookingConfig["source"]) {
    setSource(next);
    setSaving(true);
    const saved = await updateBookingConfig({
      source: next,
      externalUrl: url.trim() || null,
    });
    setSource(saved.source);
    setSaving(false);
    toast({
      title:
        saved.source === "calendly"
          ? "Bookings now use your connected calendar"
          : "Bookings now use your opening hours",
      type: "success",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-oxblood" />
            Booking setup
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose where the assistant offers times. It books the slot, marks the
          lead <strong>Booked</strong>, and alerts you.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => save("hours")}
            disabled={saving}
            className={cn(
              "rounded-lg border p-3 text-left text-sm transition-colors",
              source === "hours"
                ? "border-oxblood bg-oxblood/5"
                : "border-border hover:bg-oat",
            )}
          >
            <span className="font-medium text-ink">Opening hours</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Native pick-a-time from your business hours.
            </span>
          </button>
          <button
            type="button"
            onClick={() => url.trim() && save("calendly")}
            disabled={saving || !url.trim()}
            className={cn(
              "rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-60",
              source === "calendly"
                ? "border-oxblood bg-oxblood/5"
                : "border-border hover:bg-oat",
            )}
          >
            <span className="font-medium text-ink">Connected calendar</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Send visitors to your Calendly / Google Calendar.
            </span>
          </button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cal-url">Calendly / Google Calendar link</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cal-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://calendly.com/your-business/consult"
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => save(url.trim() ? "calendly" : "hours")}
              disabled={saving}
            >
              Save
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {/* TODO: real Google Calendar / Calendly OAuth connection */}
            Paste a scheduling link — no code required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  bookings,
  statusVariant,
  empty,
}: {
  title: string;
  bookings: Booking[];
  statusVariant: Record<BookingStatus, "success" | "muted" | "danger">;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bookings.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-oat text-oxblood">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{b.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {b.service} · {formatDateTime(b.start)}
                </p>
              </div>
              <Badge variant={statusVariant[b.status]} className="capitalize">
                {b.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function NewBookingForm({
  slots,
  leads,
  onCreate,
}: {
  slots: TimeSlot[];
  leads: Lead[];
  onCreate: (input: {
    customerName: string;
    customerEmail: string;
    service: string;
    start: string;
    leadId: string | null;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("HydraFacial");
  const [start, setStart] = useState(slots[0]?.start ?? "");
  const [leadId, setLeadId] = useState<string>("");

  // Selecting a lead pre-fills their details so the booking links back to them.
  function pickLead(id: string) {
    setLeadId(id);
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      setName(lead.name);
      setEmail(lead.email);
      if (lead.qualification.service) setService(lead.qualification.service);
    }
  }

  return (
    <Card className="border-oxblood/30">
      <CardHeader>
        <CardTitle className="text-base">Book a time</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.trim() || !start) return;
            onCreate({
              customerName: name,
              customerEmail: email,
              service,
              start,
              leadId: leadId || null,
            });
          }}
        >
          {leads.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="b-lead">Link to a lead (optional)</Label>
              <select
                id="b-lead"
                value={leadId}
                onChange={(e) => pickLead(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">No linked lead</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.intent || l.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Booking a linked lead moves them to <strong>Booked</strong>.
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="b-name">Customer name</Label>
              <Input
                id="b-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-email">Email</Label>
              <Input
                id="b-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-service">Service</Label>
            <Input
              id="b-service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pick a time</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.slice(0, 9).map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => setStart(s.start)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs transition-colors",
                    start === s.start
                      ? "border-oxblood bg-oxblood text-cream"
                      : "border-border bg-card text-ink hover:bg-oat",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {slots.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No open slots in business hours this week.
              </p>
            )}
          </div>
          <Button type="submit">
            <Check className="h-4 w-4" />
            Confirm booking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
