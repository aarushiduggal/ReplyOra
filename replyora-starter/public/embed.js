/* Replyora embed loader — vanilla, dependency-free.
 *
 * Usage on a customer's site:
 *   <script src="https://app.replyora.com/embed.js" data-key="rk_..." async></script>
 *
 * Creates a floating bubble inside a shadow DOM and injects an iframe pointing
 * at /widget/<publicKey> for hard style + script isolation from the host page.
 * Loader <-> iframe talk via postMessage (open/close/resize).
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var publicKey = script.getAttribute("data-key");
  if (!publicKey) {
    console.error("[Replyora] Missing data-key on embed script.");
    return;
  }

  // Derive the app origin from this script's own URL.
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (e) {
    origin = "";
  }

  var brandColor = script.getAttribute("data-color") || "#5C1A1A";
  var widgetUrl = origin + "/widget/" + encodeURIComponent(publicKey);

  // --- shadow host so the host page can't style us ---
  var host = document.createElement("div");
  host.setAttribute("data-replyora", "");
  host.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483647;";
  document.body.appendChild(host);
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var style = document.createElement("style");
  style.textContent =
    ".ro-btn{width:56px;height:56px;border:none;border-radius:50%;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;" +
    "justify-content:center;color:#fff;transition:transform .15s ease;}" +
    ".ro-btn:hover{transform:scale(1.05);}" +
    ".ro-panel{position:absolute;bottom:72px;right:0;width:380px;height:560px;" +
    "max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);border:none;" +
    "border-radius:18px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.3);" +
    "background:#fff;display:none;}" +
    ".ro-panel.open{display:block;}";
  root.appendChild(style);

  var iframe = document.createElement("iframe");
  iframe.className = "ro-panel";
  iframe.src = widgetUrl;
  iframe.setAttribute("title", "Replyora chat");
  root.appendChild(iframe);

  var btn = document.createElement("button");
  btn.className = "ro-btn";
  btn.style.background = brandColor;
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 ' +
    '8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 ' +
    '0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 ' +
    '8.48 0 0 1 8 8v.5z"/></svg>';

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    iframe.classList.toggle("open", open);
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  });

  // Allow the iframe to request close/resize.
  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data || {};
    if (data.type === "replyora:close") {
      open = false;
      iframe.classList.remove("open");
    }
  });
})();
