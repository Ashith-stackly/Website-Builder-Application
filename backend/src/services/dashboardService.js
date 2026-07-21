const Workspace = require('../models/Workspace');
const Deployment = require('../models/Deployment');
const analyticsService = require('./analyticsService');

/**
 * Dashboard summary endpoint — returns all the data the dashboard page needs
 * in a SINGLE API call, eliminating the N+1 fan-out pattern where the frontend
 * was previously calling getProjectAnalytics() once per project.
 */
async function getDashboardSummary(userId) {
  // 1. Get project counts by status (single aggregation)
  const statusCounts = await Workspace.aggregate([
    { $match: { userId, status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
      },
    },
  ]);

  const counts = statusCounts[0] || { total: 0, active: 0, archived: 0 };

  // 2. Published projects count (have at least one 'deployed' deployment)
  const workspaceIds = await Workspace.find(
    { userId, status: { $ne: 'deleted' } },
    { _id: 1 }
  ).lean();
  const wsIds = workspaceIds.map((w) => w._id);

  let publishedCount = 0;
  if (wsIds.length > 0) {
    const publishedWorkspaces = await Deployment.distinct('workspaceId', {
      workspaceId: { $in: wsIds },
      status: 'deployed',
    });
    publishedCount = publishedWorkspaces.length;
  }

  // 3. Aggregate analytics across all projects (single pipeline)
  const analytics = await analyticsService.getAggregateAnalytics(userId, 30);

  // 4. Recent projects (last 5 updated)
  const recentProjects = await Workspace.find(
    { userId, status: { $ne: 'deleted' } },
    { projectName: 1, category: 1, status: 1, updatedAt: 1, createdAt: 1 }
  )
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  return {
    projects: {
      total: counts.total,
      active: counts.active,
      archived: counts.archived,
      published: publishedCount,
    },
    analytics,
    recentProjects: recentProjects.map((p) => ({
      _id: p._id,
      projectName: p.projectName,
      category: p.category || '',
      status: p.status,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    })),
  };
}

module.exports = { getDashboardSummary };
