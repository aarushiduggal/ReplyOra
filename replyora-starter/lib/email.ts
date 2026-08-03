import "server-only";

/**
 * Transactional email seam.
 *
 * Dormant until an email provider key is set (mirrors HAS_STRIPE / HAS_ANTHROPIC):
 * - With `RESEND_API_KEY` set, `sendEmail` posts to Resend's REST API.
 * - Without one, it logs the email in dev and no-ops in production, returning
 *   `{ sent: false }` so callers can carry on — an owner alert should never block
 *   a lead, booking or handoff.
 *
 * All notification fan-out (new lead, new booking, handoff, growth engines)
 * flows through here, so wiring a real provider later is a one-file change.
 *
 * Env: RESEND_API_KEY, EMAIL_FROM (e.g. "Replyora <alerts@replyora.com>").
 */

export const HAS_EMAIL = Boolean(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Replyora <alerts@replyora.com>";

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body (always sent). */
  text: string;
  /** Optional HTML body; falls back to a simple wrap of `text`. */
  html?: string;
}

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

/**
 * Best-effort send. Never throws — returns `{ sent: false, reason }` on any
 * problem so notification callers stay fire-and-forget.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!msg.to || !EMAIL_RE.test(msg.to)) {
    return { sent: false, reason: "no valid recipient" };
  }

  if (!HAS_EMAIL) {
    // Dormant seam — surface the intent in dev, stay silent in prod.
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email:dormant] would send to ${msg.to} — "${msg.subject}"`,
      );
    }
    return { sent: false, reason: "email provider not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html ?? wrapHtml(msg.subject, msg.text),
      }),
    });
    if (!res.ok) {
      return { sent: false, reason: `provider ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "send failed" };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Minimal branded HTML wrapper for plain-text notifications. */
function wrapHtml(subject: string, text: string): string {
  const body = text
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(line)}</p>`)
    .join("");
  return `<div style="font-family:system-ui,-apple-system,sans-serif;color:#2B1413;max-width:520px">
    <div style="background:#5C1A1A;color:#FBF7EF;padding:14px 20px;border-radius:10px 10px 0 0;font-weight:600">Replyora</div>
    <div style="border:1px solid #EAE3D2;border-top:0;border-radius:0 0 10px 10px;padding:20px">
      <h2 style="margin:0 0 12px;font-size:18px;color:#5C1A1A">${escapeHtml(subject)}</h2>
      ${body}
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
