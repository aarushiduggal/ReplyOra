"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function InstallSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-border bg-ink p-4 pr-14 text-xs leading-relaxed text-cream">
        <code>{snippet}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute right-3 top-3"
        onClick={copy}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
