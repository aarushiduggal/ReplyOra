/**
 * ReplyOra Social — per-page GUIDE content (Entire Socials-style).
 * Plain data module (no "use client") so it can be imported anywhere.
 *
 * primaryHref may contain "{id}" — GuideTrigger replaces it with the current
 * client id. localStorage "seen" is keyed by pageKey only (one guide per page,
 * shared across clients).
 */

export interface GuideStep {
  label: string;
  description: string;
}

export interface GuideConfig {
  pageKey: string;
  title: string;
  intro: string;
  steps: GuideStep[];
  /** Muted left link — just closes the guide. */
  secondaryLabel: string;
  /** Right primary button — navigates to primaryHref, then closes. */
  primaryLabel: string;
  primaryHref: string;
}

export const GUIDES = {
  clients: {
    pageKey: "clients",
    title: "Welcome to ReplyOra",
    intro: "Two quick things to get your studio started.",
    steps: [
      {
        label: "Add your first client",
        description:
          "Add client creates a brand with its own grid, calendar and assets.",
      },
      {
        label: "Set up your account",
        description:
          "Settings → Workspace: agency name, logo, address; then Billing for invoice defaults.",
      },
    ],
    secondaryLabel: "Continue",
    primaryLabel: "Open settings",
    primaryHref: "/settings",
  },
  overview: {
    pageKey: "overview",
    title: "Your client's home base",
    intro: "Status, pillars and private notes for this brand — all in one place.",
    steps: [
      { label: "Finish setup", description: "Work the checklist to get the account ready." },
      { label: "Set pillars & deliverables", description: "Content themes and the monthly deliverables." },
      { label: "Watch the numbers", description: "Posts planned, in approval, and approved." },
      { label: "Private notes", description: "Agency-only — the client never sees them." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Open grid",
    primaryHref: "/clients/{id}/grid",
  },
  grid: {
    pageKey: "grid",
    title: "Plan the feed",
    intro: "Plan how the feed will look before anything goes live.",
    steps: [
      { label: "Place assets on the feed", description: "Drag from the library onto tiles, or add a post." },
      { label: "Batch first? Open Studio", description: "Turn a shoot dump into posts, carousels and reels." },
      { label: "Upload from your phone", description: "Scan the QR to send photos from your camera roll." },
      { label: "Edit post details", description: "Click a tile for caption, hashtags, pillar and schedule." },
      { label: "Reorder & preview", description: "Drag tiles; the client sees this in their portal." },
    ],
    secondaryLabel: "Start planning",
    primaryLabel: "Open studio",
    primaryHref: "/clients/{id}/studio",
  },
  calendar: {
    pageKey: "calendar",
    title: "Schedule everything",
    intro: "Everything for this client's schedule. Plan, then create & schedule.",
    steps: [
      { label: "Planner", description: "Content concepts for client sign-off before production." },
      { label: "Month", description: "Visual calendar — click a day to create a post." },
      { label: "Spreadsheet", description: "A list of every post with bulk edits." },
      { label: "Approval Queue", description: "Send finished posts for client sign-off." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Open planner",
    primaryHref: "/clients/{id}/calendar",
  },
  studio: {
    pageKey: "studio",
    title: "Batch your content",
    intro: "Batch raw content into ready-to-caption posts.",
    steps: [
      { label: "Name your batch", description: "Give the set a name you'll recognise later." },
      { label: "Pick or upload assets", description: "Choose from the library or upload new media." },
      { label: "Arrange", description: "Order them into posts, carousels and reels." },
      { label: "Generate captions", description: "AI writes in the brand voice; edit and save." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Open grid",
    primaryHref: "/clients/{id}/grid",
  },
  assets: {
    pageKey: "assets",
    title: "Your media library",
    intro: "Upload and organise the photos and videos that power the grid and calendar.",
    steps: [
      { label: "Upload media", description: "Drop JPG, PNG or MP4; tag to a pillar." },
      { label: "Create folders", description: "Organise by campaign, shoot or pillar." },
      { label: "Client uploads", description: "Files your client sends appear here too." },
      { label: "Use everywhere", description: "Place on the grid, in Studio, or on calendar posts." },
    ],
    secondaryLabel: "Upload assets",
    primaryLabel: "Open grid",
    primaryHref: "/clients/{id}/grid",
  },
  chatbox: {
    pageKey: "chatbox",
    title: "The website assistant",
    intro: "An AI assistant this client can embed on their website.",
    steps: [
      { label: "Train", description: "Add FAQs, services and pricing; upload docs or a website URL." },
      { label: "Configure", description: "Name, tone, brand colour, welcome message and lead fields." },
      { label: "Preview", description: "Test it live before it goes on the site." },
      { label: "Install", description: "Copy the one-line embed for their website." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Open train",
    primaryHref: "/clients/{id}/chatbox",
  },
  approvals: {
    pageKey: "approvals",
    title: "Client review",
    intro: "Where client review happens.",
    steps: [
      { label: "Send for review", description: "Push finished posts to the queue." },
      { label: "Client decides", description: "Approve, or request changes with a note." },
      { label: "Portal", description: "The client sees the same queue in their portal." },
      { label: "Track", description: "Approved posts flow to the calendar." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Open calendar",
    primaryHref: "/clients/{id}/calendar",
  },
  reports: {
    pageKey: "reports",
    title: "Performance reports",
    intro: "A client-call dashboard for performance.",
    steps: [
      { label: "Pick a date range", description: "Compare against the previous period." },
      { label: "Top posts & pillars", description: "See what performed and which themes led." },
      { label: "Executive summary", description: "Edit it before presenting." },
      { label: "Export", description: "Download a branded PDF." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Connect Instagram",
    primaryHref: "/clients/{id}/integrations",
  },
  invoices: {
    pageKey: "invoices",
    title: "Billing",
    intro: "Bill this client and track what's owed.",
    steps: [
      { label: "Check the totals", description: "Billed, paid, outstanding and past due." },
      { label: "New invoice", description: "Add line items and a due date." },
      { label: "Bill to", description: "Defaults come from Settings." },
      { label: "Send & export", description: "Issue and download a branded PDF." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "New invoice",
    primaryHref: "/clients/{id}/invoices",
  },
  integrations: {
    pageKey: "integrations",
    title: "Connect accounts",
    intro: "Connect this client's social accounts.",
    steps: [
      { label: "Connect Instagram", description: "Needed for publishing and reports (paid feature)." },
      { label: "Connect TikTok", description: "Link the client's TikTok account." },
      { label: "Published posts", description: "They appear as reference tiles on the Grid." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Connect Instagram",
    primaryHref: "/clients/{id}/integrations",
  },
  tasks: {
    pageKey: "tasks",
    title: "Your to-do board",
    intro: "Track work across all your clients.",
    steps: [
      { label: "Add a task", description: "Optionally tag it to a client." },
      { label: "Move it", description: "To do → In progress → Completed." },
      { label: "Sort", description: "Order the board by due date." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Add task",
    primaryHref: "/tasks",
  },
  settings: {
    pageKey: "settings",
    title: "Account & studio",
    intro: "Your account and how your studio appears to clients.",
    steps: [
      { label: "Profile", description: "Name, email and password." },
      { label: "Workspace", description: "Agency name, logo and address for portals, invoices and reports." },
      { label: "Billing", description: "Your plan and client billing defaults." },
    ],
    secondaryLabel: "Got it",
    primaryLabel: "Open workspace",
    primaryHref: "/settings",
  },
} satisfies Record<string, GuideConfig>;

export type GuideKey = keyof typeof GUIDES;
