const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Deployment = require('../models/Deployment');
const BlogPost = require('../models/BlogPost');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const Template = require('../models/Template');
const AnalyticsEvent = require('../models/AnalyticsEvent');

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

function getDateRange(daysValue) {
  const requestedDays = Number(daysValue);
  const days = Number.isInteger(requestedDays)
    ? Math.max(1, Math.min(requestedDays, MAX_DAYS))
    : DEFAULT_DAYS;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return { days, since };
}

function toCountMap(rows) {
  return rows.reduce((result, row) => {
    result[row._id || 'unknown'] = row.count;
    return result;
  }, {});
}

/**
 * Platform-only aggregation. This service is intentionally separate from the
 * user dashboard service: its queries are cross-account and its route is
 * protected by both authentication and the admin role middleware.
 */
async function getAdminDashboardSummary(options = {}) {
  const { days, since } = getDateRange(options.days);

  const [
    registeredUsers,
    verifiedUsers,
    activeUsers,
    newUsers,
    activeSubscriptions,
    workspaces,
    publishedSites,
    templates,
    blogCounts,
    orderSummary,
    subscriptionSummary,
    deploymentCounts,
    analyticsSummary,
    plans,
    recentUsers,
    recentDeployments,
    dailyTraffic,
    topWorkspaces,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ lastLoginAt: { $gte: since } }),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ subscriptionStatus: 'active' }),
    Workspace.countDocuments({ status: { $ne: 'deleted' } }),
    Workspace.countDocuments({ status: { $ne: 'deleted' }, publishedAt: { $ne: null } }),
    Template.countDocuments(),
    BlogPost.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: since } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),
    Subscription.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    ]),
    Deployment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { eventType: 'page_view', timestamp: { $gte: since } } },
      {
        $facet: {
          views: [{ $count: 'count' }],
          visitors: [
            { $match: { sessionId: { $ne: '' } } },
            { $group: { _id: '$sessionId' } },
            { $count: 'count' },
          ],
        },
      },
    ]),
    User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
    User.find({}, { name: 1, email: 1, plan: 1, role: 1, createdAt: 1, lastLoginAt: 1 })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Deployment.find({}, { workspaceId: 1, userId: 1, version: 1, status: 1, deployedAt: 1, createdAt: 1, s3Url: 1 })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('workspaceId', 'projectName')
      .populate('userId', 'name email')
      .lean(),
    AnalyticsEvent.aggregate([
      { $match: { eventType: 'page_view', timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          views: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { eventType: 'page_view', timestamp: { $gte: since } } },
      { $group: { _id: '$workspaceId', views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'workspaces', localField: '_id', foreignField: '_id', as: 'workspace' } },
      { $unwind: { path: '$workspace', preserveNullAndEmptyArrays: true } },
      { $match: { 'workspace.status': { $ne: 'deleted' } } },
      {
        $project: {
          _id: 0,
          workspaceId: '$_id',
          projectName: '$workspace.projectName',
          views: 1,
          visitors: { $size: { $filter: { input: '$sessions', as: 'session', cond: { $ne: ['$$session', ''] } } } },
        },
      },
    ]),
  ]);

  const blogByStatus = toCountMap(blogCounts);
  const deploymentsByStatus = toCountMap(deploymentCounts);
  const analytics = analyticsSummary[0] || {};
  const paidOrders = orderSummary[0] || { count: 0, revenue: 0 };

  return {
    range: { days, since: since.toISOString() },
    users: {
      total: registeredUsers,
      verified: verifiedUsers,
      active: activeUsers,
      new: newUsers,
      byPlan: toCountMap(plans),
    },
    workspaces: {
      total: workspaces,
      published: publishedSites,
    },
    content: {
      templates,
      blogs: {
        total: Object.values(blogByStatus).reduce((total, value) => total + value, 0),
        published: blogByStatus.published || 0,
        drafts: blogByStatus.draft || 0,
      },
    },
    commerce: {
      paidOrders: paidOrders.count || 0,
      paidRevenue: paidOrders.revenue || 0,
      subscriptions: activeSubscriptions,
      subscriptionRevenue: subscriptionSummary
        .filter((item) => item._id === 'completed')
        .reduce((total, item) => total + (item.revenue || 0), 0),
    },
    deployments: {
      deployed: deploymentsByStatus.deployed || 0,
      pending: (deploymentsByStatus.pending || 0) + (deploymentsByStatus.building || 0),
      failed: deploymentsByStatus.failed || 0,
    },
    analytics: {
      views: analytics.views?.[0]?.count || 0,
      visitors: analytics.visitors?.[0]?.count || 0,
      daily: dailyTraffic.map((entry) => ({
        date: entry._id,
        views: entry.views,
        visitors: entry.sessions.filter(Boolean).length,
      })),
    },
    topWorkspaces: topWorkspaces.map((workspace) => ({
      workspaceId: workspace.workspaceId.toString(),
      projectName: workspace.projectName || 'Deleted workspace',
      views: workspace.views,
      visitors: workspace.visitors,
    })),
    recentUsers: recentUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null,
    })),
    recentDeployments: recentDeployments.map((deployment) => ({
      id: deployment._id.toString(),
      workspace: deployment.workspaceId?.projectName || 'Deleted workspace',
      user: deployment.userId?.name || deployment.userId?.email || 'Deleted user',
      version: deployment.version,
      status: deployment.status,
      deployedAt: deployment.deployedAt || deployment.createdAt,
      url: deployment.s3Url || '',
    })),
    observability: {
      storage: null,
      apiUsage: null,
      errors: null,
      note: 'Storage, API-usage, and error metrics require an infrastructure observability provider.',
    },
  };
}

module.exports = { getAdminDashboardSummary };
