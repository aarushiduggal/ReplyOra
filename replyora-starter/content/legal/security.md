# Security & Trust

**Last updated:** [DD Month 2026]

At Replyora, your business's data — and your customers' data — is the most important thing we hold. This page explains, in plain language, how we protect it. Replyora is currently pre-launch; we're building security in from day one, not bolting it on later.

## Your data stays yours

You own the information you upload and the leads and conversations your assistant collects. We use it only to run your assistant and provide the Service — we never sell it, and we don't use your content to train third-party AI models.

## Tenant isolation by design

Replyora is multi-tenant, which means many businesses run on the same platform. Every business gets its own isolated workspace. We enforce this at the database level with **row-level security**, so one business can never see or reach another's knowledge base, conversations, or leads. Server-side, every request is scoped to your workspace and is never trusted from the browser.

## Encryption

All data is encrypted **in transit** (TLS/HTTPS) and **at rest**. Sensitive credentials and API keys are stored server-side only and are never exposed in the chat widget or the browser.

## The chat widget is safe to embed

The widget you place on your website loads in an **isolated iframe with a shadow DOM**, so it can't collide with — or be tampered with by — your site's code. The public key in your embed snippet only permits scoped, rate-limited chat; it can never read your dashboard or your data. Each assistant also enforces a **domain allowlist**, so it only runs on the websites you approve.

## Payments

Payments and card details are handled entirely by **Stripe**, a PCI-DSS Level 1 certified provider. Replyora never sees or stores full card numbers.

## Trusted infrastructure & subprocessors

We build on established providers and share data with them only as needed to run the Service, under confidentiality and data-protection obligations:

| Provider | Purpose |
|---|---|
| Supabase | Database, authentication, file storage |
| Anthropic / OpenAI | AI responses and embeddings (your content is not used to train their models) |
| Stripe | Payments and subscriptions |
| Vercel | Application hosting and delivery |

## Access & accountability

We follow least-privilege access, keep secrets out of client code, and maintain audit logs of sensitive actions (member changes, data deletion, plan changes). You stay in control: you can export your data or delete individual sources, leads, conversations, or your entire workspace at any time.

## Privacy & compliance

We handle personal information in line with the **Australian Privacy Act 1988** and the **Australian Privacy Principles**, and with the **GDPR** where it applies. In the event of an eligible data breach, we will notify affected users and regulators as required under the **Notifiable Data Breaches** scheme. See our [Privacy Policy](/privacy) for full detail.

## Responsible disclosure

Found a security issue? We appreciate your help. Please email **hello.replyora@gmail.com** with the details and give us a reasonable chance to fix it before public disclosure.

## Questions

Email **hello.replyora@gmail.com** — we're happy to talk through how we protect your data.
