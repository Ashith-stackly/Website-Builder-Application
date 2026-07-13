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

  const filter = { workspaceId, timestamp: { $gte: since } };

  // Total counts
  const [totalViews, uniqueSessionsAgg, dailyViewsAgg, topPagesAgg] = await Promise.all([
    AnalyticsEvent.countDocuments({ ...filter, eventType: 'page_view' }),
    AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: 'page_view', sessionId: { $ne: '' } } },
      { $group: { _id: '$sessionId' } },
      { $count: 'count' },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: 'page_view' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...filter, eventType: 'page_view' } },
      { $group: { _id: '$path', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const uniqueVisitors = uniqueSessionsAgg[0]?.count || 0;

  return {
    totalViews,
    uniqueVisitors,
    days,
    dailyViews: dailyViewsAgg.map((d) => ({ date: d._id, views: d.views })),
    topPages: topPagesAgg.map((p) => ({ path: p._id, views: p.views })),
  };
}

module.exports = { ingestEvent, getProjectAnalytics };
