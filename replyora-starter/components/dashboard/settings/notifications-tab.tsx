"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "@/lib/data/types";

const CHANNELS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}[] = [
  { key: "inApp", label: "In-app", description: "Toasts and the notification bell." },
  { key: "email", label: "Email", description: "Send alerts to your inbox." },
  { key: "sms", label: "SMS", description: "Text the owner for hot leads." },
  { key: "push", label: "Push", description: "Browser / mobile push alerts." },
];

export function NotificationsTab({
  settings: initial,
}: {
  settings: NotificationSettings;
}) {
  const [settings, setSettings] = useState(initial);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how you're alerted when a lead is captured or a booking is made.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {CHANNELS.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.description}</p>
            </div>
            <Switch
              checked={settings[c.key]}
              onCheckedChange={(v) =>
                setSettings((prev) => ({ ...prev, [c.key]: v }))
              }
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Email/SMS/push delivery is stubbed. // TODO: Resend + Twilio + web push.
        </p>
      </CardContent>
    </Card>
  );
}
