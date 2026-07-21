/**
 * Builds the small, self-contained tracker included only in generated site
 * documents. The builder itself never executes this code.
 */

export interface AnalyticsTrackingConfig {
  workspaceId?: string | null;
  apiBaseUrl?: string | null;
}

const WORKSPACE_ID_PATTERN = /^[a-f\d]{24}$/i;

export const isAnalyticsWorkspaceId = (value?: string | null): value is string =>
  typeof value === "string" && WORKSPACE_ID_PATTERN.test(value);

const safeInlineValue = (value: string) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const getAnalyticsEventEndpoint = (apiBaseUrl?: string | null) => {
  const value = typeof apiBaseUrl === "string" ? apiBaseUrl.trim() : "";
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return `${url.toString().replace(/\/+$/, "")}/analytics/event`;
  } catch {
    return "";
  }
};

/**
 * Generated site pages use the existing public analytics endpoint.
 * Invalid or unavailable configuration deliberately produces no script rather
 * than a broken document or a client-side exception.
 */
export const buildAnalyticsTrackingScript = ({
  workspaceId,
  apiBaseUrl,
}: AnalyticsTrackingConfig): string => {
  if (!isAnalyticsWorkspaceId(workspaceId)) return "";

  const endpoint = getAnalyticsEventEndpoint(apiBaseUrl);
  if (!endpoint) return "";

  return `
    <script data-stackly-analytics="page-view">
      (function () {
        "use strict";

        if (window.__stackly_preview || window.__stackly_draft || window.__stacklyAnalyticsTrackerLoaded) return;
        window.__stacklyAnalyticsTrackerLoaded = true;

        var workspaceId = ${safeInlineValue(workspaceId)};
        var endpoint = ${safeInlineValue(endpoint)};
        var sessionKey = "stackly_session_id";
        var lastTrackedPath = "";

        function defer(callback) {
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(callback, { timeout: 1500 });
            return;
          }
          window.setTimeout(callback, 0);
        }

        function getSessionId() {
          var sessionId = "";
          try {
            sessionId = window.sessionStorage.getItem(sessionKey) || "";
          } catch (error) {}

          if (!sessionId) {
            var randomPart = window.crypto && typeof window.crypto.randomUUID === "function"
              ? window.crypto.randomUUID()
              : Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
            sessionId = "s_" + randomPart;
            try {
              window.sessionStorage.setItem(sessionKey, sessionId);
            } catch (error) {}
          }

          return sessionId;
        }

        function getPath() {
          return String(window.location.pathname || "/").slice(0, 2048);
        }

        function getReferrer() {
          if (!document.referrer) return "";
          try {
            var referrer = new URL(document.referrer);
            return (referrer.origin + referrer.pathname).slice(0, 2048);
          } catch (error) {
            return "";
          }
        }

        function post(payload, attempt) {
          if (typeof XMLHttpRequest === "undefined") return;

          var request = new XMLHttpRequest();
          var settled = false;
          function finish(status) {
            if (settled) return;
            settled = true;

            // Retry only an explicit transient server failure. Retrying an
            // ambiguous network error can create a duplicate page view.
            if (status >= 500 && attempt < 1 && (typeof navigator === "undefined" || navigator.onLine !== false)) {
              window.setTimeout(function () { post(payload, attempt + 1); }, 750);
            }
          }

          try {
            request.open("POST", endpoint, true);
            request.withCredentials = false;
            request.timeout = 4000;
            request.setRequestHeader("Content-Type", "application/json");
            request.onload = function () { finish(request.status); };
            request.onerror = function () { finish(0); };
            request.ontimeout = function () { finish(0); };
            request.send(JSON.stringify(payload));
          } catch (error) {
            finish(0);
          }
        }

        function send(payload) {
          // Offline visitors are retried once if the page remains open and
          // connectivity returns; no request is made while offline.
          if (typeof navigator !== "undefined" && navigator.onLine === false) {
            window.addEventListener("online", function () { post(payload, 0); }, { once: true });
            return;
          }
          post(payload, 0);
        }

        function trackPageView() {
          var path = getPath();
          if (path === lastTrackedPath) return;
          lastTrackedPath = path;

          var timestamp = new Date().toISOString();
          send({
            workspaceId: workspaceId,
            eventType: "page_view",
            path: path,
            referrer: getReferrer(),
            userAgent: typeof navigator === "undefined" ? "" : String(navigator.userAgent || "").slice(0, 512),
            sessionId: getSessionId(),
            timestamp: timestamp
          });
        }

        function schedulePageView() {
          defer(trackPageView);
        }

        window.addEventListener("pageshow", function (event) {
          // A bfcache restoration is a fresh visit to this page. Resetting the
          // in-page guard records it once without duplicating the initial load.
          if (event && event.persisted) lastTrackedPath = "";
          schedulePageView();
        });

        if (window.history) {
          ["pushState", "replaceState"].forEach(function (method) {
            var original = window.history[method];
            if (typeof original !== "function") return;
            window.history[method] = function () {
              var result = original.apply(this, arguments);
              schedulePageView();
              return result;
            };
          });
          window.addEventListener("popstate", schedulePageView);
        }
      })();
    </script>`;
};
