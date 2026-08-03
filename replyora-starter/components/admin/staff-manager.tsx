"use client";

import { useState, useTransition } from "react";
import { Trash2, UserPlus } from "lucide-react";

import { adminAddStaff, adminRemoveStaff } from "@/lib/admin/actions";
import { toast } from "@/lib/toast";
import type { StaffRole } from "@/lib/admin/access";

export interface StaffRow {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: string;
}

export function StaffManager({
  staff,
  canManage,
}: {
  staff: StaffRow[];
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const [rows, setRows] = useState(staff);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="mb-3 font-semibold text-ink">Platform admins</h2>
      <div className="divide-y divide-border">
        {rows.map((s) => (
          <div key={s.userId} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm text-ink">{s.name}</p>
              <p className="text-xs text-ink/40">{s.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink/60">
                {s.role}
              </span>
              {canManage && s.role !== "superadmin" && (
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await adminRemoveStaff(s.userId);
                      setRows((prev) => prev.filter((x) => x.userId !== s.userId));
                      toast({ title: "Staff removed", type: "success" });
                    })
                  }
                  className="text-ink/40 hover:text-rose-600"
                  aria-label="Remove staff"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canManage ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@replyora.com"
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="staff">staff</option>
            <option value="superadmin">superadmin</option>
          </select>
          <button
            disabled={pending || !email.trim()}
            onClick={() =>
              start(async () => {
                await adminAddStaff(email.trim(), role);
                setRows((prev) => [
                  ...prev,
                  { userId: `pending_${Date.now()}`, name: email.split("@")[0] ?? email, email: email.trim(), role, createdAt: new Date().toISOString() },
                ]);
                setEmail("");
                toast({ title: "Staff invited", type: "success" });
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-oxblood px-3 py-2 text-sm font-medium text-cream hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> Add
          </button>
        </div>
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-xs text-ink/40">
          Only superadmins can add or remove staff.
        </p>
      )}
    </div>
  );
}
