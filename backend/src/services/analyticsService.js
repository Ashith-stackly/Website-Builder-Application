const AnalyticsEvent = require('../models/AnalyticsEvent');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

async function ingestEvent(eventData) {
  const { workspaceId, eventType, path, referrer, userAgent, ip, sessionId, metadata } = eventData;
  if (!workspaceId) throw ApiError.badRequest('workspaceId is required');

  return AnalyticsEvent.create({
    workspaceId,
    eventType: eventType || 'page_view',
    path: path || '/',
    referrer: referrer || '',
    userAgent: userAgent || '',
    ip: ip || '',
    sessionId: sessionId || '',
    metadata: metadata || {},
  });
}

async function getProjectAnalytics(userId, workspaceId, query = {}) {
  // Verify ownership
  const workspace = await Workspace.exists({
    _id: workspaceId,
    userId,
    status: { $ne: 'deleted' },
  });
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const days = Number(query.days || 30);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const events = await AnalyticsEvent.find({
    workspaceId,
    eventType: 'page_view',
    timestamp: { $gte: since }
  }).sort({ timestamp: 1 }).lean();

  const totalViews = events.length;
  const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean));
  const uniqueVisitors = uniqueSessions.size;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayViews = events.filter(e => new Date(e.timestamp) >= todayStart).length;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weeklyViews = events.filter(e => new Date(e.timestamp) >= weekStart).length;

  // 1. Daily Aggregation with padding
  const dailyTraffic = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];

    const dayEvents = events.filter(e => {
      try {
        return new Date(e.timestamp).toISOString().split('T')[0] === dateKey;
      } catch (err) {
        return false;
      }
    });

    const dayViews = dayEvents.length;
    const daySessions = new Set(dayEvents.map(e => e.sessionId).filter(Boolean));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortDate = `${months[d.getMonth()]} ${d.getDate()}`;

    dailyTraffic.push({
      date: shortDate,
      views: dayViews,
      visitors: daySessions.size
    });
  }

  // 2. Weekly Aggregation
  function formatShortDate(dateObj) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
  }

  function getWeekLabel(timestamp) {
    const d = new Date(timestamp);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    return `Week of ${formatShortDate(monday)}`;
  }

  const weeklyMap = new Map();
  events.forEach((e) => {
    const weekLabel = getWeekLabel(e.timestamp);
    const existing = weeklyMap.get(weekLabel) ?? { views: 0, sessions: new Set() };
    existing.views++;
    if (e.sessionId) existing.sessions.add(e.sessionId);
    weeklyMap.set(weekLabel, existing);
  });

  const weeklyTraffic = Array.from(weeklyMap.entries()).map(([week, val]) => ({
    week,
    views: val.views,
    visitors: val.sessions.size,
  })).sort((a, b) => a.week.localeCompare(b.week));

  // 3. Top Pages
  const pageMap = new Map();
  events.forEach((e) => {
    const path = e.path || '/';
    pageMap.set(path, (pageMap.get(path) ?? 0) + 1);
  });

  const topPages = Array.from(pageMap.entries())
    .map(([page, views]) => ({
      page,
      views,
      percentage: totalViews > 0 ? Math.round((views / totalViews) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 4. Recent Activity
  const recentActivity = events
    .slice(-20)
    .reverse()
    .map(e => ({
      id: e._id.toString(),
      page: e.path || '/',
      timestamp: new Date(e.timestamp).getTime(),
      sessionId: e.sessionId || ''
    }));

  return {
    totalViews,
    uniqueVisitors,
    todayViews,
    weeklyViews,
    dailyTraffic,
    weeklyTraffic,
    topPages,
    recentActivity
  };
}

module.exports = { ingestEvent, getProjectAnalytics };
