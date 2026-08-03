"use client";

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NotificationsTab } from "@/components/dashboard/settings/notifications-tab";
import { AutomationTab } from "@/components/dashboard/settings/automation-tab";
import { DataTab } from "@/components/dashboard/settings/data-tab";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { PLANS, SETUP_FEE_AUD, TRIAL_DAYS, type PlanConfig } from "@/lib/stripe/plans";
import { startCheckout, openBillingPortal } from "@/lib/stripe/checkout-client";
import { seatUsage } from "@/lib/usage";
import type {
  FollowupRule,
  NotificationSettings,
  Plan,
  User,
  WorkspaceMember,
} from "@/lib/data/types";

export function SettingsTabs({
  user,
  members,
  currentPlan,
  plans,
  messagesUsed,
  workspaceName,
  notificationSettings,
  followupRule,
  exportData,
}: {
  user: User;
  members: WorkspaceMember[];
  currentPlan: Plan;
  plans: Record<Plan, PlanConfig>;
  messagesUsed: number;
  workspaceName: string;
  notificationSettings: NotificationSettings;
  followupRule: FollowupRule;
  exportData: unknown;
}) {
  return (
    <Tabs defaultValue="profile">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="automation">Automation</TabsTrigger>
        <TabsTrigger value="billing">Plan &amp; billing</TabsTrigger>
        <TabsTrigger value="data">Data</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab user={user} />
      </TabsContent>
      <TabsContent value="members">
        <MembersTab members={members} currentPlan={currentPlan} />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab settings={notificationSettings} />
      </TabsContent>
      <TabsContent value="automation">
        <AutomationTab rule={followupRule} />
      </TabsContent>
      <TabsContent value="billing">
        <BillingTab
          currentPlan={currentPlan}
          plans={plans}
          messagesUsed={messagesUsed}
        />
      </TabsContent>
      <TabsContent value="data">
        <DataTab workspaceName={workspaceName} exportData={exportData} />
      </TabsContent>
    </Tabs>
  );
}

function ProfileTab({ user }: { user: User }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Your profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-oxblood text-lg text-cream">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm">
            Change photo
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Full name</Label>
          <Input id="p-name" defaultValue={user.fullName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" type="email" defaultValue={user.email} />
        </div>
        <Button
          onClick={() => {
            setStatus("saving");
            setTimeout(() => setStatus("saved"), 600);
          }}
          disabled={status === "saving"}
        >
          {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "saved" && <Check className="h-4 w-4" />}
          {status === "saved" ? "Saved" : "Save profile"}
        </Button>
      </CardContent>
    </Card>
  );
}

function MembersTab({
  members,
  currentPlan,
}: {
  members: WorkspaceMember[];
  currentPlan: Plan;
}) {
  const seats = seatUsage(currentPlan, members.length);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Team members</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {seats.used} of {seats.limit} seats used on the{" "}
            {PLANS[currentPlan].name} plan
          </p>
        </div>
        <Button size="sm" disabled={seats.atCapacity}>
          <Plus className="h-4 w-4" />
          {seats.atCapacity ? "Seat limit reached" : "Invite member"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-oat text-xs text-wine">
                        {initials(m.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-ink">{m.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={m.role === "owner" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {m.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BillingTab({
  currentPlan,
  plans,
  messagesUsed,
}: {
  currentPlan: Plan;
  plans: Record<Plan, PlanConfig>;
  messagesUsed: number;
}) {
  const order: Plan[] = ["starter", "growth", "pro"];
  const current = plans[currentPlan];
  const pct = Math.min(
    100,
    Math.round((messagesUsed / current.messagesPerMonth) * 100),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-oxblood">
              {current.name}
            </p>
            <p className="text-sm text-muted-foreground">
              ${current.priceAud}/mo · {messagesUsed.toLocaleString()} of{" "}
              {current.messagesPerMonth.toLocaleString()} messages used ({pct}%)
            </p>
            <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-oat">
              <div
                className="h-full bg-oxblood"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Button variant="outline" onClick={() => void openBillingPortal()}>
            Manage billing
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {order.map((p) => {
          const plan = plans[p];
          const active = p === currentPlan;
          return (
            <div
              key={p}
              className={cn(
                "rounded-2xl border bg-card p-5",
                active ? "border-oxblood ring-2 ring-oxblood/20" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-ink">{plan.name}</h3>
                {active && <Badge>Current</Badge>}
              </div>
              <p className="mt-2 font-display text-2xl text-oxblood">
                ${plan.priceAud}
                <span className="text-sm text-muted-foreground">/mo</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                + ${SETUP_FEE_AUD} one-time setup
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li>{plan.messagesPerMonth.toLocaleString()} messages/mo</li>
                <li>~{plan.kbPages} pages knowledge base</li>
                <li>{plan.teamSeats} team seats</li>
                <li>{plan.service.updateCadence}</li>
              </ul>
              <Button
                variant={active ? "outline" : "default"}
                size="sm"
                className="mt-4 w-full"
                disabled={active}
                onClick={() => !active && void startCheckout(p)}
              >
                {active ? "Active" : "Choose"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        New workspaces start a {TRIAL_DAYS}-day free trial; a one-time $
        {SETUP_FEE_AUD} setup fee applies on the first invoice. Billing is mocked
        in the prototype. Real version: Stripe Checkout &amp; customer portal
        (lib/stripe).
      </p>
    </div>
  );
}
