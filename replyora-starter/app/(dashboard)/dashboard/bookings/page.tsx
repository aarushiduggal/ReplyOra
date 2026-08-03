import { listBookings, getAvailableSlots } from "@/lib/data/bookings";
import { getBookingConfig } from "@/lib/data/booking-config";
import { listLeads } from "@/lib/data/leads";
import { getBookingReminders } from "@/lib/data/growth";
import { getWorkspace } from "@/lib/data/workspace";
import { hasFeature } from "@/lib/usage";
import { relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { BookingsView } from "@/components/dashboard/bookings-view";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { GrowthActionList, type GrowthRow } from "@/components/dashboard/growth-list";

export default async function BookingsPage() {
  const [bookings, slots, workspace, config, leads, reminders] =
    await Promise.all([
      listBookings(),
      getAvailableSlots(),
      getWorkspace(),
      getBookingConfig(),
      listLeads(),
      getBookingReminders(),
    ]);

  const canBook = hasFeature(workspace.plan, "booking");
  const canReduceNoShows = hasFeature(workspace.plan, "noShowReduction");
  const reminderRows: GrowthRow[] = reminders.map((r) => ({
    id: r.id,
    title: `${r.customer} — ${r.service}`,
    subtitle: `Appointment ${relativeTime(r.start)}`,
    done: r.status !== "scheduled",
    doneLabel: r.status === "confirmed" ? "Confirmed" : "Reminder sent",
  }));
  // Leads still worth booking (surfaced in the manual booking form).
  const openLeads = leads.filter(
    (l) => l.status === "new" || l.status === "qualified",
  );

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Appointments your assistant booked, plus a native pick-a-time flow."
      />
      <div className="mx-auto max-w-4xl p-6">
        {canBook ? (
          <BookingsView
            initialBookings={bookings}
            slots={slots}
            config={config}
            leads={openLeads}
          />
        ) : (
          <UpgradeGate
            flag="booking"
            description="Let your assistant offer times from your opening hours or a connected calendar, book the appointment, mark the lead “Booked,” and notify you — all automatically."
          />
        )}

        {/* No-show reduction (Pro) */}
        <div className="mt-10">
          <h2 className="mb-3 font-display text-xl text-oxblood">
            No-show reduction
          </h2>
          {canReduceNoShows ? (
            <GrowthActionList
              kind="reminder"
              path="/dashboard/bookings"
              actionLabel="Send reminder"
              emptyLabel="No upcoming appointments need a reminder."
              rows={reminderRows}
            />
          ) : (
            <UpgradeGate
              flag="noShowReduction"
              description="Automatically send appointment reminders and confirmations before bookings — plus easy rebooking of cancellations — so customers actually turn up."
            />
          )}
        </div>
      </div>
    </div>
  );
}
