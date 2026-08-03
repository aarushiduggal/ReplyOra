export type ToastType = "success" | "info" | "lead" | "booking" | "error";

export interface ToastPayload {
  title: string;
  body?: string;
  type?: ToastType;
}

export const TOAST_EVENT = "replyora:toast";

/**
 * Fire an in-app toast. Used to surface owner alerts (new lead, booking made).
 * The email/SMS/push fan-out is stubbed in lib/data/notifications.ts.
 */
export function toast(payload: ToastPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }));
}
