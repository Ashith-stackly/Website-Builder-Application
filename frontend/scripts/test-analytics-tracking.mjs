import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const typescript = require("typescript");

const trackingSourceUrl = new URL("../lib/analyticsTracking.ts", import.meta.url);
const trackingSource = readFileSync(trackingSourceUrl, "utf8");
const compiledTracking = typescript.transpileModule(trackingSource, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
}).outputText;

const trackingModule = { exports: {} };
new Function("exports", "require", "module", compiledTracking)(
  trackingModule.exports,
  require,
  trackingModule,
);

const {
  buildAnalyticsTrackingScript,
  getAnalyticsEventEndpoint,
} = trackingModule.exports;

const workspaceId = "507f1f77bcf86cd799439011";
const apiBaseUrl = "https://api.stackly.test/api/";

function scriptBody(markup) {
  const match = markup.match(/<script[^>]*>([\s\S]*)<\/script>/i);
  assert.ok(match, "expected generated analytics script");
  return match[1];
}

function createBrowser({ online = true, status = 201, preview = false, path = "/pricing", storage = new Map() } = {}) {
  const requests = [];
  const listeners = new Map();
  const location = { pathname: path };

  const addEventListener = (type, callback) => {
    const callbacks = listeners.get(type) || [];
    callbacks.push(callback);
    listeners.set(type, callbacks);
  };
  const emit = (type, event = {}) => {
    (listeners.get(type) || []).slice().forEach((callback) => callback(event));
  };

  class FakeXMLHttpRequest {
    open(method, url, async) {
      this.method = method;
      this.url = url;
      this.async = async;
    }

    setRequestHeader(name, value) {
      this.headers ||= {};
      this.headers[name] = value;
    }

    send(body) {
      requests.push({
        method: this.method,
        url: this.url,
        async: this.async,
        body,
        headers: this.headers,
      });
      this.status = status;
      this.onload?.();
    }
  }

  const history = {
    pushState(_state, _title, url) {
      if (url) location.pathname = new URL(String(url), "https://site.stackly.test").pathname;
    },
    replaceState(_state, _title, url) {
      if (url) location.pathname = new URL(String(url), "https://site.stackly.test").pathname;
    },
  };
  const window = {
    location,
    history,
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
    crypto: { randomUUID: () => "session-test-id" },
    requestIdleCallback: (callback) => callback(),
    setTimeout: (callback) => {
      callback();
      return 1;
    },
    addEventListener,
    __stackly_preview: preview,
  };

  return {
    context: {
      window,
      document: { referrer: "https://search.example/results?private=query" },
      navigator: { onLine: online, userAgent: "Analytics Tracker Test" },
      XMLHttpRequest: FakeXMLHttpRequest,
      URL,
      Date,
      Math,
      JSON,
    },
    emit,
    history,
    location,
    requests,
    storage,
  };
}

assert.equal(
  getAnalyticsEventEndpoint(apiBaseUrl),
  "https://api.stackly.test/api/analytics/event",
);
assert.equal(buildAnalyticsTrackingScript({ workspaceId: "not-a-workspace", apiBaseUrl }), "");
assert.equal(buildAnalyticsTrackingScript({ apiBaseUrl }), "");

const generated = buildAnalyticsTrackingScript({ workspaceId, apiBaseUrl });
assert.match(generated, /data-stackly-analytics="page-view"/);

const browser = createBrowser();
vm.runInNewContext(scriptBody(generated), browser.context);
browser.emit("pageshow", { persisted: false });
assert.equal(browser.requests.length, 1, "initial page load should send exactly one view");

const initialPayload = JSON.parse(browser.requests[0].body);
assert.equal(browser.requests[0].method, "POST");
assert.equal(browser.requests[0].url, "https://api.stackly.test/api/analytics/event");
assert.equal(browser.requests[0].async, true);
assert.equal(initialPayload.workspaceId, workspaceId);
assert.equal(initialPayload.eventType, "page_view");
assert.equal(initialPayload.path, "/pricing");
assert.equal(initialPayload.referrer, "https://search.example/results");
assert.equal(initialPayload.sessionId, "s_session-test-id");
assert.ok(Date.parse(initialPayload.timestamp), "payload should have an ISO timestamp");

browser.emit("pageshow", { persisted: false });
assert.equal(browser.requests.length, 1, "duplicate pageshow should not duplicate a view");

browser.history.pushState({}, "", "/about");
assert.equal(browser.requests.length, 2, "history navigation should send one new view");
assert.equal(JSON.parse(browser.requests[1].body).path, "/about");
assert.equal(JSON.parse(browser.requests[1].body).sessionId, initialPayload.sessionId);

browser.emit("pageshow", { persisted: true });
assert.equal(browser.requests.length, 3, "bfcache restoration should count as one fresh visit");

const secondPageBrowser = createBrowser({ path: "/contact", storage: browser.storage });
vm.runInNewContext(scriptBody(generated), secondPageBrowser.context);
secondPageBrowser.emit("pageshow", { persisted: false });
assert.equal(secondPageBrowser.requests.length, 1, "a second generated page should track independently");
assert.equal(JSON.parse(secondPageBrowser.requests[0].body).path, "/contact");
assert.equal(JSON.parse(secondPageBrowser.requests[0].body).sessionId, initialPayload.sessionId);

const refreshedPageBrowser = createBrowser({ storage: browser.storage });
vm.runInNewContext(scriptBody(generated), refreshedPageBrowser.context);
refreshedPageBrowser.emit("pageshow", { persisted: false });
assert.equal(refreshedPageBrowser.requests.length, 1, "a refresh should record a new page view");

const previewBrowser = createBrowser({ preview: true });
vm.runInNewContext(scriptBody(generated), previewBrowser.context);
previewBrowser.emit("pageshow", { persisted: false });
assert.equal(previewBrowser.requests.length, 0, "preview documents must never track");

const offlineBrowser = createBrowser({ online: false });
vm.runInNewContext(scriptBody(generated), offlineBrowser.context);
offlineBrowser.emit("pageshow", { persisted: false });
assert.equal(offlineBrowser.requests.length, 0, "offline load should not throw or send a request");
offlineBrowser.context.navigator.onLine = true;
offlineBrowser.emit("online");
assert.equal(offlineBrowser.requests.length, 1, "queued offline view should retry when online");

const retryBrowser = createBrowser({ status: 503 });
vm.runInNewContext(scriptBody(generated), retryBrowser.context);
retryBrowser.emit("pageshow", { persisted: false });
assert.equal(retryBrowser.requests.length, 2, "one transient-server retry is allowed");

const exportHtmlSource = readFileSync(new URL("../lib/exportHtml.ts", import.meta.url), "utf8");
const exportButtonSource = readFileSync(new URL("../components/builder/ExportButton.tsx", import.meta.url), "utf8");
const builderStoreSource = readFileSync(new URL("../store/builderStore.ts", import.meta.url), "utf8");
assert.match(exportHtmlSource, /buildAnalyticsTrackingScript\(/);
assert.match(exportHtmlSource, /generateHtml\(components, seo, workspaceId, tokens(?:, layout)?\)/);
assert.match(exportButtonSource, /prepareDeploymentPackage/);
assert.match(exportButtonSource, /createStandaloneHtml/);
assert.match(builderStoreSource, /currentProjectId \|\| undefined/);

console.log("Analytics tracking regression tests passed");
