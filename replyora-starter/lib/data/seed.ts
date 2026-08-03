/**
 * Seeded in-memory demo data for the prototype.
 *
 * One demo tenant — "Coastal Glow Skin Clinic" — fully populated so every screen
 * has realistic content. This is the ONLY place mock data is defined; the
 * lib/data/*.ts accessors read from here and will be replaced by Supabase queries.
 *
 * // TODO: replace with Supabase — delete this file once real data lands.
 */

import type {
  Assistant,
  Booking,
  BusinessProfile,
  Conversation,
  FollowupRule,
  KnowledgeSource,
  Lead,
  NicheTemplate,
  NotificationItem,
  NotificationSettings,
  UsageCounter,
  User,
  Workspace,
  WorkspaceMember,
} from "./types";

export const DEMO_USER: User = {
  id: "user_demo_owner",
  email: "amara@coastalglow.com.au",
  fullName: "Amara Nguyen",
  avatarUrl: null,
};

export const DEMO_WORKSPACE: Workspace = {
  id: "ws_demo",
  name: "Coastal Glow Skin Clinic",
  slug: "coastal-glow",
  ownerId: DEMO_USER.id,
  plan: "growth",
  planStatus: "active",
  trialEndsAt: null,
  createdAt: "2026-05-12T09:00:00.000Z",
};

export const DEMO_MEMBERS: WorkspaceMember[] = [
  {
    userId: DEMO_USER.id,
    email: DEMO_USER.email,
    fullName: DEMO_USER.fullName,
    role: "owner",
    createdAt: "2026-05-12T09:00:00.000Z",
  },
  {
    userId: "user_demo_admin",
    email: "jess@coastalglow.com.au",
    fullName: "Jess Patel",
    role: "admin",
    createdAt: "2026-05-20T02:30:00.000Z",
  },
  {
    userId: "user_demo_member",
    email: "front.desk@coastalglow.com.au",
    fullName: "Front Desk",
    role: "member",
    createdAt: "2026-06-02T22:15:00.000Z",
  },
];

export const DEMO_BUSINESS_PROFILE: BusinessProfile = {
  workspaceId: DEMO_WORKSPACE.id,
  industry: "Skin & beauty clinic",
  description:
    "Coastal Glow is a boutique skin clinic in Manly offering medical-grade facials, laser treatments, cosmetic injectables and skin-health consultations. Our nurses and dermal therapists tailor every treatment to your skin goals.",
  website: "https://coastalglow.com.au",
  phone: "(02) 8123 4567",
  email: "hello@coastalglow.com.au",
  address: "Shop 4, 22 The Corso, Manly NSW 2095",
  hours: {
    mon: { open: "09:00", close: "18:00" },
    tue: { open: "09:00", close: "18:00" },
    wed: { open: "09:00", close: "20:00" },
    thu: { open: "09:00", close: "20:00" },
    fri: { open: "09:00", close: "18:00" },
    sat: { open: "09:00", close: "16:00" },
    sun: { open: "", close: "", closed: true },
  },
  timezone: "Australia/Sydney",
};

export const DEMO_ASSISTANT: Assistant = {
  id: "asst_demo",
  workspaceId: DEMO_WORKSPACE.id,
  publicKey: "rk_demo_8f2a4c6e1b9d3a7f",
  name: "Glow Concierge",
  tone: "friendly",
  model: "claude-haiku",
  temperature: 0.3,
  brandColor: "#5C1A1A",
  welcomeMessage:
    "Hi, I'm the Glow Concierge 👋 Ask me about treatments, pricing or availability — or I can help you book a consult.",
  suggestedQuestions: [
    "What does a HydraFacial cost?",
    "Do you offer skin consultations?",
    "Are you open on Saturdays?",
    "How do I book laser hair removal?",
  ],
  leadFields: [
    { key: "name", label: "Full name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone", label: "Phone", required: false },
  ],
  allowedDomains: ["coastalglow.com.au", "www.coastalglow.com.au"],
  status: "active",
};

export const DEMO_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: "ks_services",
    workspaceId: DEMO_WORKSPACE.id,
    type: "service",
    title: "Treatment menu & services",
    preview:
      "HydraFacial, dermal needling, LED therapy, laser hair removal, cosmetic injectables, skin consultations…",
    status: "ready",
    error: null,
    sizeBytes: 18_400,
    createdAt: "2026-05-12T10:05:00.000Z",
  },
  {
    id: "ks_pricing",
    workspaceId: DEMO_WORKSPACE.id,
    type: "pricing",
    title: "Price list 2026",
    preview:
      "HydraFacial $189 · Express facial $99 · Dermal needling $299 · Laser (small area) from $79 · Consult $50 (redeemable)…",
    status: "ready",
    error: null,
    sizeBytes: 9_120,
    createdAt: "2026-05-12T10:08:00.000Z",
  },
  {
    id: "ks_faq",
    workspaceId: DEMO_WORKSPACE.id,
    type: "faq",
    title: "Common questions",
    preview:
      "Q: Do I need a patch test? Q: How long is downtime? Q: Do you offer payment plans? Q: Cancellation policy?",
    status: "ready",
    error: null,
    sizeBytes: 6_540,
    createdAt: "2026-05-13T01:20:00.000Z",
  },
  {
    id: "ks_policies",
    workspaceId: DEMO_WORKSPACE.id,
    type: "file",
    title: "Clinic-Policies-2026.pdf",
    preview:
      "Cancellations require 24 hours notice. Deposits are required for injectable appointments…",
    status: "processing",
    error: null,
    sizeBytes: 244_000,
    createdAt: "2026-06-28T03:45:00.000Z",
  },
  {
    id: "ks_aftercare",
    workspaceId: DEMO_WORKSPACE.id,
    type: "file",
    title: "Laser-Aftercare.docx",
    preview:
      "Upload failed while extracting text — file may be password protected.",
    status: "failed",
    error: "Could not extract text from document.",
    sizeBytes: 51_200,
    createdAt: "2026-06-29T22:10:00.000Z",
  },
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    workspaceId: DEMO_WORKSPACE.id,
    visitorId: "vis_a1",
    pageUrl: "https://coastalglow.com.au/treatments/hydrafacial",
    status: "closed",
    handledBy: "assistant",
    preview: "How much is a HydraFacial and how long does it take?",
    messageCount: 6,
    capturedLead: true,
    startedAt: "2026-06-30T03:12:00.000Z",
    lastMessageAt: "2026-06-30T03:18:00.000Z",
    notes: [],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "How much is a HydraFacial and how long does it take?",
        createdAt: "2026-06-30T03:12:00.000Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Our signature HydraFacial is $189 and takes about 45–60 minutes — including a cleanse, gentle exfoliation, painless extractions and a hydrating serum infusion. There's no downtime, so you can head straight back to your day. Would you like me to help you book one?",
        createdAt: "2026-06-30T03:12:30.000Z",
      },
      {
        id: "m3",
        role: "user",
        content: "Yes please, do you have anything this Saturday?",
        createdAt: "2026-06-30T03:14:00.000Z",
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "We're open Saturday 9am–4pm. I can take your details and lock in a Saturday slot for you. Could I grab your name and the best email or mobile to reach you?",
        createdAt: "2026-06-30T03:14:20.000Z",
      },
      {
        id: "m5",
        role: "user",
        content: "Sophie Turner, sophie.t@gmail.com, 0412 555 901",
        createdAt: "2026-06-30T03:16:00.000Z",
      },
      {
        id: "m6",
        role: "assistant",
        content:
          "Perfect, thanks Sophie! You're booked for a HydraFacial this Saturday at 10:00 am. Anything else I can help with in the meantime? ✨",
        createdAt: "2026-06-30T03:18:00.000Z",
      },
    ],
  },
  {
    id: "conv_2",
    workspaceId: DEMO_WORKSPACE.id,
    visitorId: "vis_b2",
    pageUrl: "https://coastalglow.com.au/treatments/laser",
    status: "open",
    handledBy: "assistant",
    preview: "Do you do laser hair removal for full legs?",
    messageCount: 4,
    capturedLead: true,
    startedAt: "2026-06-30T22:40:00.000Z",
    lastMessageAt: "2026-06-30T22:46:00.000Z",
    notes: [],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Do you do laser hair removal for full legs? Roughly what cost?",
        createdAt: "2026-06-30T22:40:00.000Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Yes! We offer laser hair removal across the body. Small areas start from $79; full legs are one of our larger areas, so pricing is quoted at your first session after a quick patch test. Most clients do a course of 6 sessions for best results. Want me to arrange a free laser consult?",
        createdAt: "2026-06-30T22:40:40.000Z",
      },
      {
        id: "m3",
        role: "user",
        content: "Yeah that'd be great",
        createdAt: "2026-06-30T22:44:00.000Z",
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Lovely — what's your name and a good mobile number? I'll get our laser therapist to reach out with consult times this week.",
        createdAt: "2026-06-30T22:46:00.000Z",
      },
    ],
  },
  {
    id: "conv_3",
    workspaceId: DEMO_WORKSPACE.id,
    visitorId: "vis_c3",
    pageUrl: "https://coastalglow.com.au/",
    status: "closed",
    handledBy: "assistant",
    preview: "Are you open on Sundays?",
    messageCount: 2,
    capturedLead: false,
    startedAt: "2026-06-29T06:05:00.000Z",
    lastMessageAt: "2026-06-29T06:05:30.000Z",
    notes: [],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Are you open on Sundays?",
        createdAt: "2026-06-29T06:05:00.000Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "We're closed Sundays, but open Monday–Saturday. Our late nights are Wednesday and Thursday until 8pm, and Saturdays 9am–4pm. Can I help you find a time during the week?",
        createdAt: "2026-06-29T06:05:30.000Z",
      },
    ],
  },
  {
    id: "conv_4",
    workspaceId: DEMO_WORKSPACE.id,
    visitorId: "vis_d4",
    pageUrl: "https://coastalglow.com.au/booking",
    status: "open",
    handledBy: "assistant",
    preview: "Do you offer payment plans for injectables?",
    messageCount: 3,
    capturedLead: true,
    startedAt: "2026-06-28T23:30:00.000Z",
    lastMessageAt: "2026-06-28T23:33:00.000Z",
    notes: [],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Do you offer payment plans for injectables?",
        createdAt: "2026-06-28T23:30:00.000Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "We do — we offer Afterpay and Zip for most treatments, including cosmetic injectables. A nurse consult is required first so we can tailor a plan to you. Would you like me to take your details for a consult?",
        createdAt: "2026-06-28T23:31:00.000Z",
      },
      {
        id: "m3",
        role: "user",
        content: "Sure — Marcus, marcus.lee@outlook.com",
        createdAt: "2026-06-28T23:33:00.000Z",
      },
    ],
  },
  {
    id: "conv_5",
    workspaceId: DEMO_WORKSPACE.id,
    visitorId: "vis_e5",
    pageUrl: "https://coastalglow.com.au/treatments",
    status: "closed",
    handledBy: "assistant",
    preview: "What's the difference between needling and a HydraFacial?",
    messageCount: 2,
    capturedLead: false,
    startedAt: "2026-06-27T04:48:00.000Z",
    lastMessageAt: "2026-06-27T04:48:40.000Z",
    notes: [],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "What's the difference between dermal needling and a HydraFacial?",
        createdAt: "2026-06-27T04:48:00.000Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Great question! A HydraFacial ($189) is a gentle, no-downtime treatment for instant hydration and glow. Dermal needling ($299) goes deeper — it stimulates collagen to improve texture, scarring and fine lines, with a day or two of mild redness. If you tell me your main skin goal, I can suggest which suits you best.",
        createdAt: "2026-06-27T04:48:40.000Z",
      },
    ],
  },
  {
    id: "conv_6",
    workspaceId: DEMO_WORKSPACE.id,
    visitorId: "vis_f6",
    pageUrl: "https://coastalglow.com.au/contact",
    status: "open",
    handledBy: "human",
    preview: "Where are you located and is there parking?",
    messageCount: 3,
    capturedLead: false,
    startedAt: "2026-07-01T01:02:00.000Z",
    lastMessageAt: "2026-07-01T01:05:30.000Z",
    notes: [
      {
        id: "n1",
        author: "Jess Patel",
        body: "Took over — visitor wanted specific parking validation details.",
        createdAt: "2026-07-01T01:05:00.000Z",
      },
    ],
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Where are you located and is there parking nearby?",
        createdAt: "2026-07-01T01:02:00.000Z",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "We're at Shop 4, 22 The Corso, Manly — right in the heart of the pedestrian mall. The closest parking is the Whistler Street car park, about a 4-minute walk away. Were you hoping to pop in for a treatment or a consult?",
        createdAt: "2026-07-01T01:02:30.000Z",
      },
      {
        id: "m3",
        role: "assistant",
        content:
          "Hi, it's Jess from the team 👋 We can validate up to 2 hours of Whistler Street parking for treatments over $150 — just bring your ticket to reception.",
        createdAt: "2026-07-01T01:05:30.000Z",
      },
    ],
  },
];

export const DEMO_LEADS: Lead[] = [
  {
    id: "lead_1",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: "conv_1",
    name: "Sophie Turner",
    email: "sophie.t@gmail.com",
    phone: "0412 555 901",
    intent: "Saturday HydraFacial booking",
    status: "booked",
    score: "hot",
    scoreValue: 92,
    qualification: {
      service: "HydraFacial",
      urgency: "This week",
      suburb: "Manly",
      budget: "$150–250",
    },
    createdAt: "2026-06-30T03:16:00.000Z",
  },
  {
    id: "lead_2",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: "conv_2",
    name: "Daniel Cho",
    email: "dan.cho@gmail.com",
    phone: "0421 778 220",
    intent: "Full-leg laser consult",
    status: "qualified",
    score: "hot",
    scoreValue: 84,
    qualification: {
      service: "Laser hair removal",
      urgency: "Within 2 weeks",
      suburb: "Freshwater",
      budget: "$500+ (course)",
    },
    createdAt: "2026-06-30T22:46:00.000Z",
  },
  {
    id: "lead_3",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: "conv_4",
    name: "Marcus Lee",
    email: "marcus.lee@outlook.com",
    phone: "",
    intent: "Injectables + payment plan",
    status: "new",
    score: "warm",
    scoreValue: 61,
    qualification: {
      service: "Cosmetic injectables",
      urgency: "Exploring",
      suburb: null,
      budget: "Payment plan",
    },
    createdAt: "2026-06-28T23:33:00.000Z",
  },
  {
    id: "lead_4",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: null,
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "0433 010 558",
    intent: "Acne skin consultation",
    status: "qualified",
    score: "warm",
    scoreValue: 68,
    qualification: {
      service: "Skin consultation",
      urgency: "Within a month",
      suburb: "Dee Why",
      budget: "$50–100",
    },
    createdAt: "2026-06-27T05:20:00.000Z",
  },
  {
    id: "lead_5",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: null,
    name: "Olivia Brennan",
    email: "liv.brennan@gmail.com",
    phone: "0400 221 904",
    intent: "Wedding-prep facial package",
    status: "booked",
    score: "hot",
    scoreValue: 95,
    qualification: {
      service: "Facial package",
      urgency: "Wedding in 6 weeks",
      suburb: "Mosman",
      budget: "$500+",
    },
    createdAt: "2026-06-26T22:05:00.000Z",
  },
  {
    id: "lead_6",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: null,
    name: "Tom Fitzgerald",
    email: "tomf@bigpond.com",
    phone: "",
    intent: "Pricing enquiry — laser",
    status: "lost",
    score: "cold",
    scoreValue: 24,
    qualification: {
      service: "Laser hair removal",
      urgency: "Just browsing",
      suburb: null,
      budget: "Unsure",
    },
    createdAt: "2026-06-24T01:40:00.000Z",
  },
  {
    id: "lead_7",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: null,
    name: "Hannah Smith",
    email: "hannah.smith@icloud.com",
    phone: "0455 332 119",
    intent: "Dermal needling for scarring",
    status: "new",
    score: "hot",
    scoreValue: 81,
    qualification: {
      service: "Dermal needling",
      urgency: "This month",
      suburb: "Manly Vale",
      budget: "$250–500",
    },
    createdAt: "2026-07-01T00:15:00.000Z",
  },
  {
    id: "lead_8",
    workspaceId: DEMO_WORKSPACE.id,
    conversationId: null,
    name: "Grace O'Connor",
    email: "grace.oconnor@gmail.com",
    phone: "0412 889 776",
    intent: "Saturday availability — facial",
    status: "qualified",
    score: "warm",
    scoreValue: 64,
    qualification: {
      service: "Express facial",
      urgency: "This weekend",
      suburb: "Balgowlah",
      budget: "$50–100",
    },
    createdAt: "2026-06-25T23:50:00.000Z",
  },
];

export const DEMO_BOOKINGS: Booking[] = [
  {
    id: "bk_1",
    workspaceId: DEMO_WORKSPACE.id,
    leadId: "lead_1",
    conversationId: "conv_1",
    customerName: "Sophie Turner",
    customerEmail: "sophie.t@gmail.com",
    service: "HydraFacial",
    start: "2026-07-04T00:00:00.000Z",
    end: "2026-07-04T01:00:00.000Z",
    status: "confirmed",
    createdAt: "2026-06-30T03:18:00.000Z",
  },
  {
    id: "bk_2",
    workspaceId: DEMO_WORKSPACE.id,
    leadId: "lead_5",
    conversationId: null,
    customerName: "Olivia Brennan",
    customerEmail: "liv.brennan@gmail.com",
    service: "Wedding-prep facial package",
    start: "2026-07-08T04:30:00.000Z",
    end: "2026-07-08T06:00:00.000Z",
    status: "confirmed",
    createdAt: "2026-06-26T22:10:00.000Z",
  },
  {
    id: "bk_3",
    workspaceId: DEMO_WORKSPACE.id,
    leadId: null,
    conversationId: null,
    customerName: "Renee Adams",
    customerEmail: "renee.a@gmail.com",
    service: "Skin consultation",
    start: "2026-06-28T05:00:00.000Z",
    end: "2026-06-28T05:30:00.000Z",
    status: "completed",
    createdAt: "2026-06-25T10:00:00.000Z",
  },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "ntf_1",
    workspaceId: DEMO_WORKSPACE.id,
    type: "lead",
    title: "New hot lead — Hannah Smith",
    body: "Dermal needling for scarring · Manly Vale · score 81",
    href: "/dashboard/leads",
    read: false,
    createdAt: "2026-07-01T00:15:00.000Z",
  },
  {
    id: "ntf_2",
    workspaceId: DEMO_WORKSPACE.id,
    type: "handoff",
    title: "Jess took over a conversation",
    body: "Parking enquiry on the contact page.",
    href: "/dashboard/conversations/conv_6",
    read: false,
    createdAt: "2026-07-01T01:05:00.000Z",
  },
  {
    id: "ntf_3",
    workspaceId: DEMO_WORKSPACE.id,
    type: "booking",
    title: "New booking — Sophie Turner",
    body: "HydraFacial, Sat 4 Jul 10:00 am.",
    href: "/dashboard/bookings",
    read: true,
    createdAt: "2026-06-30T03:18:00.000Z",
  },
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  inApp: true,
  email: true,
  sms: false,
  push: true,
};

export const DEFAULT_FOLLOWUP: FollowupRule = {
  enabled: true,
  targetStatus: "new",
  delayHours: 24,
  message:
    "Hi {name}, it's the team at Coastal Glow 🌿 Just checking in on your enquiry about {service} — would you like us to hold a time for you this week?",
};

export const NICHE_TEMPLATES: NicheTemplate[] = [
  {
    id: "physio",
    name: "Physiotherapy clinic",
    industry: "Allied health / physio",
    emoji: "🦵",
    blurb: "Triage injuries, answer rebate questions, and book initial assessments.",
    persona: {
      name: "Clinic Assistant",
      tone: "professional",
      welcome:
        "Hi! I can help with injuries, our services, health-fund rebates, or booking an initial assessment. What's bothering you?",
    },
    suggestedQuestions: [
      "Do you treat sports injuries?",
      "Can I claim with my health fund?",
      "Do I need a referral?",
      "How soon can I get an appointment?",
    ],
    knowledge: [
      { title: "Services & conditions", preview: "Sports injuries, back/neck pain, post-op rehab, dry needling…" },
      { title: "Rebates & funding", preview: "HICAPS on-the-spot claims, EPC/CDM referrals, NDIS, DVA…" },
    ],
  },
  {
    id: "salon",
    name: "Salon & beauty",
    industry: "Hair, beauty & skin",
    emoji: "💇",
    blurb: "Quote services, capture booking intent, and fill quiet appointment slots.",
    persona: {
      name: "Booking Concierge",
      tone: "friendly",
      welcome:
        "Hey! 💖 Ask me about our services, pricing or availability — or I can help you book in.",
    },
    suggestedQuestions: [
      "How much is a cut and colour?",
      "Do you do balayage?",
      "What's your cancellation policy?",
      "Are you open this weekend?",
    ],
    knowledge: [
      { title: "Service menu & pricing", preview: "Cuts, colour, balayage, treatments, packages…" },
      { title: "Policies", preview: "Deposits, cancellations, late arrivals, patch tests…" },
    ],
  },
  {
    id: "ndis",
    name: "NDIS provider",
    industry: "Disability services",
    emoji: "🤝",
    blurb: "Explain supports, check plan-management types, and capture referrals.",
    persona: {
      name: "Supports Assistant",
      tone: "professional",
      welcome:
        "Hello 👋 I can explain the supports we offer, how funding works, and help you get started. How can I help today?",
    },
    suggestedQuestions: [
      "What supports do you provide?",
      "Do you take plan-managed clients?",
      "How do I make a referral?",
      "Do you have availability for new participants?",
    ],
    knowledge: [
      { title: "Supports & services", preview: "Support coordination, daily living, community access, SIL…" },
      { title: "Funding & eligibility", preview: "Self/plan/NDIA-managed, service agreements, referral process…" },
    ],
  },
  {
    id: "real-estate",
    name: "Real estate agency",
    industry: "Property sales & rentals",
    emoji: "🏠",
    blurb: "Qualify buyers and renters, book inspections, and capture appraisals.",
    persona: {
      name: "Property Assistant",
      tone: "professional",
      welcome:
        "Hi! I can help with listings, inspection times, rental applications, or a free appraisal. What are you after?",
    },
    suggestedQuestions: [
      "When's the next inspection?",
      "Can I book a free appraisal?",
      "What's the rental application process?",
      "Do you have anything under $900k?",
    ],
    knowledge: [
      { title: "Current listings & inspections", preview: "Open-home times, price guides, suburbs covered…" },
      { title: "Appraisals & applications", preview: "Free market appraisals, rental application steps, fees…" },
    ],
  },
  {
    id: "dentist",
    name: "Dental practice",
    industry: "Dental & oral health",
    emoji: "🦷",
    blurb: "Answer treatment and rebate questions, and book check-ups and emergencies.",
    persona: {
      name: "Reception Assistant",
      tone: "professional",
      welcome:
        "Hi! I can help with treatments, health-fund rebates, payment plans, or booking a check-up. What do you need?",
    },
    suggestedQuestions: [
      "How much is a check-up and clean?",
      "Do you take my health fund?",
      "Can I get in for a toothache today?",
      "Do you offer payment plans?",
    ],
    knowledge: [
      { title: "Treatments & pricing", preview: "Check-up & clean, fillings, whitening, Invisalign, emergencies…" },
      { title: "Rebates & payment", preview: "HICAPS on-the-spot claims, no-gap check-ups, payment plans…" },
    ],
  },
  {
    id: "gym",
    name: "Gym & fitness studio",
    industry: "Fitness & wellness",
    emoji: "🏋️",
    blurb: "Explain memberships and classes, and capture free-trial and PT leads.",
    persona: {
      name: "Membership Assistant",
      tone: "friendly",
      welcome:
        "Hey! 💪 Ask me about memberships, class times, personal training, or grab a free trial pass.",
    },
    suggestedQuestions: [
      "How much is a membership?",
      "Can I get a free trial?",
      "What are your class times?",
      "Do you have personal trainers?",
    ],
    knowledge: [
      { title: "Memberships & classes", preview: "Weekly/monthly plans, class timetable, 24/7 access, PT packages…" },
      { title: "Trials & joining", preview: "Free trial pass, joining fee, no lock-in options, student rates…" },
    ],
  },
  {
    id: "law",
    name: "Law firm",
    industry: "Legal services",
    emoji: "⚖️",
    blurb: "Explain practice areas and fees, and book consultations for new matters.",
    persona: {
      name: "Intake Assistant",
      tone: "professional",
      welcome:
        "Hello. I can explain our practice areas, fees and process, and help you book an initial consultation. How can I help?",
    },
    suggestedQuestions: [
      "Do you offer a free first consult?",
      "What areas of law do you handle?",
      "How much do you charge?",
      "How do I get started?",
    ],
    knowledge: [
      { title: "Practice areas", preview: "Family, conveyancing, wills & estates, commercial, disputes…" },
      { title: "Fees & process", preview: "Fixed fees vs hourly, initial consult, engagement steps, timelines…" },
    ],
  },
  {
    id: "cafe",
    name: "Café & restaurant",
    industry: "Hospitality",
    emoji: "☕",
    blurb: "Handle bookings, catering enquiries, dietary questions and event requests.",
    persona: {
      name: "Front-of-House Assistant",
      tone: "friendly",
      welcome:
        "Hi there! ☕ Ask me about bookings, our menu, catering, or private events — happy to help!",
    },
    suggestedQuestions: [
      "Can I book a table for tonight?",
      "Do you cater for events?",
      "Do you have vegan and gluten-free options?",
      "Are you dog-friendly?",
    ],
    knowledge: [
      { title: "Bookings & hours", preview: "Table bookings, group sizes, opening hours, walk-in policy…" },
      { title: "Menu & catering", preview: "Dietary options, catering packages, private events, functions…" },
    ],
  },
];

export const DEMO_USAGE: UsageCounter = {
  workspaceId: DEMO_WORKSPACE.id,
  periodStart: "2026-07-01",
  messagesUsed: 642,
  leadsCount: DEMO_LEADS.length,
};

// ---------- Pricing ----------
// Plan catalogue, limits, feature flags & service commitments now live in the
// single source of truth: lib/stripe/plans.ts (PLANS, SETUP_FEE_AUD, TRIAL_DAYS).
