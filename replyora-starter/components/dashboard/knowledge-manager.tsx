"use client";

import { useRef, useState } from "react";
import {
  FileText,
  HelpCircle,
  Link2,
  Trash2,
  Type,
  Upload,
} from "lucide-react";

import {
  createKnowledgeSource,
  deleteKnowledgeSource,
} from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeStatusBadge } from "@/components/dashboard/status-badges";
import { formatBytes, relativeTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { KnowledgeSource, KnowledgeType } from "@/lib/data/types";

const TYPE_ICON: Record<KnowledgeType, typeof Type> = {
  text: Type,
  faq: HelpCircle,
  file: FileText,
  url: Link2,
  pricing: FileText,
  service: FileText,
};

export function KnowledgeManager({
  initialSources,
}: {
  initialSources: KnowledgeSource[];
}) {
  const [sources, setSources] = useState<KnowledgeSource[]>(initialSources);

  async function add(input: {
    type: KnowledgeType;
    title: string;
    preview: string;
    sizeBytes?: number;
  }) {
    // // TODO: replace with Supabase insert + ingestion job.
    const res = await createKnowledgeSource(input);
    if (!res.ok) {
      toast({ title: res.error, type: "error" });
      return;
    }
    const created = res.source;
    setSources((prev) => [created, ...prev]);
    // Simulate ingestion completing.
    setTimeout(() => {
      setSources((prev) =>
        prev.map((s) =>
          s.id === created.id ? { ...s, status: "ready" } : s,
        ),
      );
    }, 2200);
  }

  async function remove(id: string) {
    await deleteKnowledgeSource(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <AddPanel onAdd={add} />
      </div>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">
            Sources ({sources.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No knowledge yet. Add text, FAQs or upload a file to train your
              assistant.
            </p>
          )}
          {sources.map((s) => {
            const Icon = TYPE_ICON[s.type];
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-oat text-oxblood">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {s.title}
                    </p>
                    <KnowledgeStatusBadge status={s.status} />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {s.error ?? s.preview}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.type} · {formatBytes(s.sizeBytes)} ·{" "}
                    {relativeTime(s.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${s.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function AddPanel({
  onAdd,
}: {
  onAdd: (input: {
    type: KnowledgeType;
    title: string;
    preview: string;
    sizeBytes?: number;
  }) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add knowledge</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="file">File</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <TextForm onAdd={onAdd} />
          </TabsContent>
          <TabsContent value="faq">
            <FaqForm onAdd={onAdd} />
          </TabsContent>
          <TabsContent value="file">
            <FileForm onAdd={onAdd} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TextForm({
  onAdd,
}: {
  onAdd: (input: {
    type: KnowledgeType;
    title: string;
    preview: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        onAdd({ type: "text", title, preview: body.slice(0, 140) });
        setTitle("");
        setBody("");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="t-title">Title</Label>
        <Input
          id="t-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Cancellation policy"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="t-body">Content</Label>
        <Textarea
          id="t-body"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Paste any text the assistant should know…"
        />
      </div>
      <Button type="submit" className="w-full">
        Add text source
      </Button>
    </form>
  );
}

function FaqForm({
  onAdd,
}: {
  onAdd: (input: {
    type: KnowledgeType;
    title: string;
    preview: string;
  }) => void;
}) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim() || !a.trim()) return;
        onAdd({ type: "faq", title: q, preview: `Q: ${q} — A: ${a}` });
        setQ("");
        setA("");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="f-q">Question</Label>
        <Input
          id="f-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Do you offer payment plans?"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-a">Answer</Label>
        <Textarea
          id="f-a"
          rows={4}
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Yes — we offer Afterpay and Zip on most treatments."
        />
      </div>
      <Button type="submit" className="w-full">
        Add FAQ pair
      </Button>
    </form>
  );
}

function FileForm({
  onAdd,
}: {
  onAdd: (input: {
    type: KnowledgeType;
    title: string;
    preview: string;
    sizeBytes?: number;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      onAdd({
        type: "file",
        title: file.name,
        preview: "Queued for ingestion — extracting text…",
        sizeBytes: file.size,
      });
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
          dragging
            ? "border-oxblood bg-oat"
            : "border-border bg-background hover:bg-oat/50"
        }`}
      >
        <Upload className="h-6 w-6 text-oxblood" />
        <span className="text-sm font-medium text-ink">
          Drop a file or click to upload
        </span>
        <span className="text-xs text-muted-foreground">
          PDF, DOCX, TXT or MD · up to 25 MB on your plan
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-center text-xs text-muted-foreground">
        Files are parsed → chunked → embedded into your knowledge base.
      </p>
    </div>
  );
}
