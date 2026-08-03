"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

/**
 * Data & privacy controls (GDPR / Aus Privacy Act): export and delete.
 * Backs the data-rights promises in the Privacy Policy.
 * // TODO: replace with a real server-side export job + workspace deletion.
 */
export function DataTab({
  workspaceName,
  exportData,
}: {
  workspaceName: string;
  exportData: unknown;
}) {
  const [confirm, setConfirm] = useState("");

  function downloadExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      ...(exportData as object),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "replyora-workspace-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export started",
      body: "Your workspace data is downloading.",
      type: "success",
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export your data</CardTitle>
          <p className="text-sm text-muted-foreground">
            Download everything in this workspace — profile, knowledge base,
            conversations, leads and bookings.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadExport}>
            <Download className="h-4 w-4" />
            Export workspace data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanently delete this workspace and all of its data. This cannot be
            undone.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">
              Type <span className="font-semibold">{workspaceName}</span> to
              confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={workspaceName}
            />
          </div>
          <Button
            variant="destructive"
            disabled={confirm !== workspaceName}
            onClick={() =>
              toast({
                title: "Workspace deletion requested",
                body: "Stubbed in the prototype — no data removed.",
                type: "info",
              })
            }
          >
            <Trash2 className="h-4 w-4" />
            Delete workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
