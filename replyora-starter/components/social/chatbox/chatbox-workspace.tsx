"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Globe, MessageSquare, Plus, Trash2, Upload } from "lucide-react";

import type { ClientAssistant, KnowledgeSource } from "@/lib/social/chatbox";
import { InstallSnippet } from "@/components/dashboard/install-snippet";
import {
  addKnowledgeAction,
  deleteKnowledgeAction,
  saveAssistantAction,
} from "@/app/(social)/clients/[id]/chatbox/actions";
import { GuideTrigger } from "@/components/social/guide";

const TABS = ["Train", "Configure", "Install"] as const;
type Tab = (typeof TABS)[number];

const KIND_ICON: Record<string, typeof FileText> = {
  faq: MessageSquare,
  text: FileText,
  url: Globe,
  file: Upload,
};

export function ChatboxWorkspace({
  clientId,
  clientName,
  assistant,
  knowledge,
  snippet,
}: {
  clientId: string;
  clientName: string;
  assistant: ClientAssistant;
  knowledge: KnowledgeSource[];
  snippet: string;
}) {
  const [tab, setTab] = useState<Tab>("Train");

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/85">
          <span className="text-oxblood">( 06 )</span> Chatbox
          <GuideTrigger pageKey="chatbox" clientId={clientId} />
        </div>
      </div>
      <p className="mb-6 max-w-xl text-[12px] font-medium text-ink/85">
        The AI assistant that lives on {clientName}&apos;s <strong>website</strong> — it
        answers visitors and captures leads 24/7. This is the website chatbox, not
        Instagram DMs.
      </p>

      <div className="flex gap-5 border-b border-ink/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              t === tab
                ? "pb-1 text-oxblood underline decoration-oxblood underline-offset-[7px]"
                : "pb-1 text-ink/80 hover:text-oxblood"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Train" && (
        <TrainTab clientId={clientId} knowledge={knowledge} />
      )}
      {tab === "Configure" && (
        <ConfigureTab clientId={clientId} assistant={assistant} />
      )}
      {tab === "Install" && (
        <div className="mt-6 max-w-xl space-y-3">
          <p className="text-[12px] font-medium text-ink/90">
            Paste this one line into {clientName}&apos;s website — it installs on any
            website (Wix, Squarespace, WordPress, custom).
          </p>
          <InstallSnippet snippet={snippet} />
          <p className="text-[11px] text-ink/80">
            Public key <code className="rounded bg-ink/5 px-1 py-0.5">{assistant.publicKey}</code> — scoped, rate-limited chat only.
          </p>
        </div>
      )}
    </div>
  );
}

function TrainTab({
  clientId,
  knowledge,
}: {
  clientId: string;
  knowledge: KnowledgeSource[];
}) {
  const router = useRouter();
  const [type, setType] = useState("faq");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [, startTransition] = useTransition();

  function add() {
    if (!title.trim() && !content.trim()) return;
    startTransition(async () => {
      await addKnowledgeAction(clientId, {
        type,
        title: title.trim() || content.trim().slice(0, 40),
        preview: content.trim() || title.trim(),
      });
      setTitle("");
      setContent("");
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
          Add knowledge
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "faq", l: "FAQ" },
            { v: "text", l: "Paste text" },
            { v: "url", l: "Website URL" },
            { v: "file", l: "PDF / DOC" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setType(o.v)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${type === o.v ? "bg-oxblood text-cream" : "border border-ink/20 text-ink/80 hover:border-oxblood"}`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "url" ? "https://client-site.com" : "Title (e.g. Pricing)"}
          className="w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
        />
        {type !== "url" && type !== "file" && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Paste any text the assistant should know — services, pricing, hours, policies…"
            className="w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
          />
        )}
        {type === "file" && (
          <p className="rounded-lg border border-dashed border-ink/20 px-3 py-4 text-center text-[11px] text-ink/80">
            Choose a PDF or DOC — its text is extracted into the knowledge base.
          </p>
        )}
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Add to knowledge base
        </button>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">
          Knowledge base ({knowledge.length})
        </p>
        {knowledge.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-ink/20 px-4 py-8 text-center text-[12px] font-medium text-ink/80">
            Nothing added yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {knowledge.map((k) => {
              const Icon = KIND_ICON[k.type] ?? FileText;
              return (
                <div key={k.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-oxblood" />
                    <div>
                      <p className="text-[12px] font-semibold text-ink">{k.title}</p>
                      <p className="line-clamp-2 text-[11px] text-ink/85">{k.preview}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteKnowledgeAction(clientId, k.id);
                      router.refresh();
                    }}
                    className="text-ink/70 hover:text-roseink"
                    aria-label="Remove source"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigureTab({
  clientId,
  assistant,
}: {
  clientId: string;
  assistant: ClientAssistant;
}) {
  const [cfg, setCfg] = useState({
    name: assistant.name,
    tone: assistant.tone,
    brandColour: assistant.brandColour,
    welcomeMessage: assistant.welcomeMessage,
    suggested: assistant.suggestedQuestions.join("\n"),
    leadFields: assistant.leadFields.join(", "),
  });
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveAssistantAction(clientId, {
        name: cfg.name,
        tone: cfg.tone,
        brandColour: cfg.brandColour,
        welcomeMessage: cfg.welcomeMessage,
        suggestedQuestions: cfg.suggested.split("\n").map((s) => s.trim()).filter(Boolean),
        leadFields: cfg.leadFields.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    });
  }

  const questions = cfg.suggested.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <L label="Assistant name"><input value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} className={inp} /></L>
        <L label="Tone"><input value={cfg.tone} onChange={(e) => setCfg({ ...cfg, tone: e.target.value })} placeholder="Friendly & professional" className={inp} /></L>
        <L label="Brand colour">
          <div className="flex items-center gap-2">
            <input type="color" value={cfg.brandColour} onChange={(e) => setCfg({ ...cfg, brandColour: e.target.value })} className="h-9 w-12 rounded border border-ink/20" />
            <input value={cfg.brandColour} onChange={(e) => setCfg({ ...cfg, brandColour: e.target.value })} className={inp} />
          </div>
        </L>
        <L label="Welcome message"><textarea rows={2} value={cfg.welcomeMessage} onChange={(e) => setCfg({ ...cfg, welcomeMessage: e.target.value })} className={inp} /></L>
        <L label="Suggested questions (one per line)"><textarea rows={3} value={cfg.suggested} onChange={(e) => setCfg({ ...cfg, suggested: e.target.value })} className={inp} /></L>
        <L label="Lead fields (comma separated)"><input value={cfg.leadFields} onChange={(e) => setCfg({ ...cfg, leadFields: e.target.value })} className={inp} /></L>
        <button type="button" onClick={save} className="inline-flex items-center gap-1.5 rounded-full bg-oxblood px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream transition-opacity hover:opacity-90">
          {status === "saved" ? "Saved ✓" : "Save assistant"}
        </button>
      </div>

      {/* Live preview */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/85">Live preview</p>
        <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-sm">
          <div className="px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: cfg.brandColour }}>
            {cfg.name || "Assistant"}
          </div>
          <div className="space-y-3 bg-white p-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink/[0.06] px-3 py-2 text-[12px] text-ink">
              {cfg.welcomeMessage || "Hi! How can we help?"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questions.slice(0, 4).map((q, i) => (
                <span key={i} className="rounded-full border px-2.5 py-1 text-[10px] font-medium" style={{ borderColor: cfg.brandColour, color: cfg.brandColour }}>
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-oxblood/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-ink/90">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
