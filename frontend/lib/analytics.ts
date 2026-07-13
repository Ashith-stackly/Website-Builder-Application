/**
 * Stackly Analytics — localStorage-based tracking and aggregation.
 *
 * Storage key: stackly_analytics
 *
 * Usage:
 *   trackPageView("/dashboard")     — records a view event
 *   trackVisitor()                   — ensures session is tracked
 *   getAnalyticsData("7days")        — returns aggregated analytics
 */

import { v4 as uuidv4 } from "uuid";
import type {
  AnalyticsEvent,
  AnalyticsData,
  AnalyticsDateFilter,
  DailyTraffic,
  WeeklyTraffic,
  TopPage,
} from "@/types/analytics";

const STORAGE_KEY = "stackly_analytics";
const SESSION_KEY = "stackly_session_id";

/* ─── Session Management ────────────────────────────────────────────── */

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/* ─── Storage Helpers ───────────────────────────────────────────────── */

function loadEvents(): AnalyticsEvent[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function persistEvents(events: AnalyticsEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    /* storage unavailable */
  }
}

/* ─── Tracking Functions ────────────────────────────────────────────── */

export function trackPageView(page: string): void {
  const event: AnalyticsEvent = {
    id: uuidv4(),
    page,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };
  const events = loadEvents();
  events.push(event);
  // Keep last 10,000 events max to prevent localStorage bloat
  const trimmed = events.length > 10000 ? events.slice(-10000) : events;
  persistEvents(trimmed);
}

export function trackVisitor(): void {
  // Ensure session is tracked; creates a session-start event
  const sessionId = getSessionId();
  const events = loadEvents();
  const hasSession = events.some((e) => e.sessionId === sessionId && e.page === "__session_start");
  if (!hasSession) {
    const event: AnalyticsEvent = {
      id: uuidv4(),
      page: "__session_start",
      timestamp: Date.now(),
      sessionId,
    };
    events.push(event);
    persistEvents(events);
  }
}

/* ─── Date Helpers ──────────────────────────────────────────────────── */

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDateRange(filter: AnalyticsDateFilter): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();
  let start: number;

  switch (filter) {
    case "today":
      start = startOfDay(now).getTime();
      break;
    case "7days":
      start = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).getTime();
      break;
    case "30days":
      start = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)).getTime();
      break;
    default:
      start = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).getTime();
  }

  return { start, end };
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getWeekLabel(ts: number): string {
  const d = new Date(ts);
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - d.getDay());
  return `Week of ${formatShortDate(weekStart.getTime())}`;
}

/* ─── Aggregation ───────────────────────────────────────────────────── */

export function getAnalyticsData(filter: AnalyticsDateFilter = "7days"): AnalyticsData {
  const allEvents = loadEvents();
  const { start, end } = getDateRange(filter);

  // Filter to page views only (exclude __session_start)
  const pageEvents = allEvents.filter(
    (e) => e.page !== "__session_start" && e.timestamp >= start && e.timestamp <= end
  );

  const todayStart = startOfDay(new Date()).getTime();
  const weekStart = startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).getTime();

  const totalViews = pageEvents.length;
  const uniqueSessions = new Set(pageEvents.map((e) => e.sessionId));
  const uniqueVisitors = uniqueSessions.size;
  const todayViews = pageEvents.filter((e) => e.timestamp >= todayStart).length;
  const weeklyViews = pageEvents.filter((e) => e.timestamp >= weekStart).length;

  // Daily traffic
  const dailyMap = new Map<string, { views: number; sessions: Set<string> }>();
  const daysCount = filter === "today" ? 1 : filter === "7days" ? 7 : 30;

  for (let i = 0; i < daysCount; i++) {
    const dayTs = startOfDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000)).getTime();
    const dateKey = formatDate(dayTs);
    dailyMap.set(dateKey, { views: 0, sessions: new Set() });
  }

  pageEvents.forEach((e) => {
    const dateKey = formatDate(e.timestamp);
    const existing = dailyMap.get(dateKey);
    if (existing) {
      existing.views++;
      existing.sessions.add(e.sessionId);
    }
  });

  const dailyTraffic: DailyTraffic[] = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date: formatShortDate(new Date(date).getTime()),
      views: data.views,
      visitors: data.sessions.size,
    }))
    .reverse();

  // Weekly traffic (group by week)
  const weeklyMap = new Map<string, { views: number; sessions: Set<string> }>();
  pageEvents.forEach((e) => {
    const weekLabel = getWeekLabel(e.timestamp);
    const existing = weeklyMap.get(weekLabel) ?? { views: 0, sessions: new Set() };
    existing.views++;
    existing.sessions.add(e.sessionId);
    weeklyMap.set(weekLabel, existing);
  });

  const weeklyTraffic: WeeklyTraffic[] = Array.from(weeklyMap.entries()).map(([week, data]) => ({
    week,
    views: data.views,
    visitors: data.sessions.size,
  }));

  // Top pages
  const pageMap = new Map<string, number>();
  pageEvents.forEach((e) => {
    pageMap.set(e.page, (pageMap.get(e.page) ?? 0) + 1);
  });

  const topPages: TopPage[] = Array.from(pageMap.entries())
    .map(([page, views]) => ({
      page,
      views,
      percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Recent activity (last 20 events)
  const recentActivity = [...pageEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  return {
    totalViews,
    uniqueVisitors,
    todayViews,
    weeklyViews,
    dailyTraffic,
    weeklyTraffic,
    topPages,
    recentActivity,
  };
}

/**
 * Seed demo analytics data for development/demo purposes.
 * Creates realistic-looking traffic over the past 30 days.
 */
export function seedDemoAnalytics(): void {
  const events: AnalyticsEvent[] = [];
  const pages = ["/dashboard", "/builder", "/landing", "/planning", "/blog", "/portfolio", "/e-commerce", "/analytics"];
  const sessionPool: string[] = [];

  // Generate 40 unique sessions
  for (let i = 0; i < 40; i++) {
    sessionPool.push(uuidv4());
  }

  // Generate events over 30 days
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const dayBase = Date.now() - dayOffset * 24 * 60 * 60 * 1000;
    // More traffic on recent days
    const eventCount = Math.floor(Math.random() * 15) + 5 + Math.max(0, 30 - dayOffset);

    for (let j = 0; j < eventCount; j++) {
      const sessionId = sessionPool[Math.floor(Math.random() * sessionPool.length)];
      const page = pages[Math.floor(Math.random() * pages.length)];
      const ts = dayBase + Math.floor(Math.random() * 24 * 60 * 60 * 1000);

      events.push({
        id: uuidv4(),
        page,
        timestamp: ts,
        sessionId,
      });
    }
  }

  persistEvents(events);
}
