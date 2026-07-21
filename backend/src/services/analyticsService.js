const AnalyticsEvent = require('../models/AnalyticsEvent');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');

/**
 * Ingest a single analytics event from a published site.
 *
 * Validates that the target workspace exists before persisting, preventing
 * orphan events and database pollution from forged workspaceIds.
 */
async function ingestEvent(eventData) {
  const { workspaceId, eventType, path, referrer, userAgent, ip, sessionId, metadata } = eventData;
  if (!workspaceId) throw ApiError.badRequest('workspaceId is required');

  // Verify the workspace actually exists (lightweight existence check)
  const exists = await Workspace.exists({ _id: workspaceId, status: { $ne: 'deleted' } });
  if (!exists) throw ApiError.notFound('Workspace not found');

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

/**
 * Get analytics for a single project using MongoDB aggregation pipelines.
 *
 * Replaces the previous in-memory approach (Array.filter/map/reduce) that
 * loaded ALL events into Node.js memory — this version pushes computation
 * to the database engine, which is far more scalable.
 */
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const mongoose = require('mongoose');
  const wId = new mongoose.Types.ObjectId(workspaceId);

  // ── 1. Summary stats via aggregation pipeline ──────────────────────────
  const [summaryResult] = await AnalyticsEvent.aggregate([
    { $match: { workspaceId: wId, eventType: 'page_view', timestamp: { $gte: since } } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        uniqueVisitors: [
          { $match: { sessionId: { $ne: '' } } },
          { $group: { _id: '$sessionId' } },
          { $count: 'count' },
        ],
        todayViews: [
          { $match: { timestamp: { $gte: todayStart } } },
          { $count: 'count' },
        ],
        weeklyViews: [
          { $match: { timestamp: { $gte: weekStart } } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const totalViews = summaryResult?.total?.[0]?.count || 0;
  const uniqueVisitors = summaryResult?.uniqueVisitors?.[0]?.count || 0;
  const todayViews = summaryResult?.todayViews?.[0]?.count || 0;
  const weeklyViews = summaryResult?.weeklyViews?.[0]?.count || 0;

  // ── 2. Daily traffic via aggregation ──────────────────────────────────
  const dailyRaw = await AnalyticsEvent.aggregate([
    { $match: { workspaceId: wId, eventType: 'page_view', timestamp: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        views: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build a padded daily array so every day in the range is represented
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dailyMap = new Map(dailyRaw.map((d) => [d._id, d]));
  const dailyTraffic = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const entry = dailyMap.get(dateKey);
    const shortDate = `${months[d.getMonth()]} ${d.getDate()}`;
    dailyTraffic.push({
      date: shortDate,
      views: entry?.views || 0,
      visitors: entry ? entry.sessions.filter((s) => s).length : 0,
    });
  }

  // ── 3. Weekly traffic via aggregation ─────────────────────────────────
  const weeklyRaw = await AnalyticsEvent.aggregate([
    { $match: { workspaceId: wId, eventType: 'page_view', timestamp: { $gte: since } } },
    {
      $addFields: {
        // ISO week start (Monday)
        weekStart: {
          $dateSubtract: {
            startDate: { $dateTrunc: { date: '$timestamp', unit: 'day' } },
            unit: 'day',
            // dayOfWeek: 1=Sun … 7=Sat; shift to Monday-based
            amount: { $mod: [{ $subtract: [{ $dayOfWeek: '$timestamp' }, 2] }, 7] },
          },
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$weekStart' } },
        views: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weeklyTraffic = weeklyRaw.map((w) => {
    const d = new Date(w._id);
    return {
      week: `Week of ${months[d.getMonth()]} ${d.getDate()}`,
      views: w.views,
      visitors: w.sessions.filter((s) => s).length,
    };
  });

  // ── 4. Top pages via aggregation ──────────────────────────────────────
  const topPagesRaw = await AnalyticsEvent.aggregate([
    { $match: { workspaceId: wId, eventType: 'page_view', timestamp: { $gte: since } } },
    { $group: { _id: '$path', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 10 },
  ]);

  const topPages = topPagesRaw.map((p) => ({
    page: p._id || '/',
    views: p.views,
    percentage: totalViews > 0 ? Math.round((p.views / totalViews) * 100) : 0,
  }));

  // ── 5. Recent activity (last 20 events — small cursor) ────────────────
  const recentEvents = await AnalyticsEvent.find({
    workspaceId: wId,
    eventType: 'page_view',
    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  const recentActivity = recentEvents.map((e) => ({
    id: e._id.toString(),
    page: e.path || '/',
    timestamp: new Date(e.timestamp).getTime(),
    sessionId: e.sessionId || '',
  }));

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
 * Get aggregated analytics across ALL of a user's projects.
 * Used by the dashboard summary endpoint.
 */
async function getAggregateAnalytics(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Get all the user's workspace IDs
  const workspaces = await Workspace.find(
    { userId, status: { $ne: 'deleted' } },
    { _id: 1 }
  ).lean();
  const workspaceIds = workspaces.map((w) => w._id);

  if (workspaceIds.length === 0) {
    return { totalViews: 0, uniqueVisitors: 0, todayViews: 0, weeklyViews: 0 };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const [result] = await AnalyticsEvent.aggregate([
    {
      $match: {
        workspaceId: { $in: workspaceIds },
        eventType: 'page_view',
        timestamp: { $gte: since },
      },
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        uniqueVisitors: [
          { $match: { sessionId: { $ne: '' } } },
          { $group: { _id: '$sessionId' } },
          { $count: 'count' },
        ],
        todayViews: [
          { $match: { timestamp: { $gte: todayStart } } },
          { $count: 'count' },
        ],
        weeklyViews: [
          { $match: { timestamp: { $gte: weekStart } } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  return {
    totalViews: result?.total?.[0]?.count || 0,
    uniqueVisitors: result?.uniqueVisitors?.[0]?.count || 0,
    todayViews: result?.todayViews?.[0]?.count || 0,
    weeklyViews: result?.weeklyViews?.[0]?.count || 0,
  };
}

module.exports = { ingestEvent, getProjectAnalytics, getAggregateAnalytics };
