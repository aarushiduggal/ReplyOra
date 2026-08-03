"use client";

import { useState } from "react";
import { ExternalLink, Plus, UserPlus } from "lucide-react";

import {
  addConversationNote,
  convertConversationToLead,
} from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { Conversation, ConversationNote } from "@/lib/data/types";

export function ConversationSidebar({
  conversation,
}: {
  conversation: Conversation;
}) {
  const [notes, setNotes] = useState<ConversationNote[]>(conversation.notes);
  const [noteDraft, setNoteDraft] = useState("");
  const [converted, setConverted] = useState(conversation.capturedLead);

  async function addNote() {
    if (!noteDraft.trim()) return;
    const note = await addConversationNote(
      conversation.id,
      "You",
      noteDraft.trim(),
    );
    setNotes((prev) => [...prev, note]);
    setNoteDraft("");
  }

  return (
    <div className="space-y-6">
      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Messages
            </span>
            <span className="text-ink">{conversation.messageCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Last activity
            </span>
            <span className="text-ink">
              {formatDateTime(conversation.lastMessageAt)}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Source
            </p>
            <a
              href={
                conversation.pageUrl.startsWith("http")
                  ? conversation.pageUrl
                  : undefined
              }
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 break-all text-sm text-oxblood hover:underline"
            >
              {conversation.pageUrl.replace("https://", "")}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Convert to lead */}
      {!converted && (
        <ConvertToLead
          conversation={conversation}
          onConverted={() => setConverted(true)}
        />
      )}

      {/* Internal notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No notes yet. Add context for your team.
            </p>
          )}
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg bg-oat/60 p-3">
              <p className="text-sm text-ink">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.author} · {relativeTime(n.createdAt)}
              </p>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addNote();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addNote}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConvertToLead({
  conversation,
  onConverted,
}: {
  conversation: Conversation;
  onConverted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    await convertConversationToLead(conversation, {
      name,
      email,
      phone,
      intent: conversation.preview,
    });
    onConverted();
    toast({ title: "Lead created", body: name, type: "lead" });
  }

  return (
    <Card className="border-oxblood/30">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Convert to lead</CardTitle>
        {!open && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Capture
          </Button>
        )}
      </CardHeader>
      {open && (
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone (optional)</Label>
              <Input
                id="c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Create lead
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
