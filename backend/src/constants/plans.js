/**
 * Plan-based limits for Stackly.
 *
 * These limits are enforced in service-layer creation methods
 * (projectService.createProject, workspaceService.createWorkspace).
 */

const PLAN_LIMITS = {
  free:     { maxProjects: 3,   maxPages: 5,  customDomain: false, analytics: false },
  basic:    { maxProjects: 10,  maxPages: 20, customDomain: false, analytics: true  },
  business: { maxProjects: 25,  maxPages: 50, customDomain: true,  analytics: true  },
  advanced: { maxProjects: 50,  maxPages: 100, customDomain: true,  analytics: true  },
  premium:  { maxProjects: -1,  maxPages: -1, customDomain: true,  analytics: true  }, // -1 = unlimited
};

/**
 * Plans with their pricing (in smallest currency unit — paise for INR).
 */
const PLAN_PRICING = {
  basic:    { name: 'Basic Plan',    amount: 4000  },
  business: { name: 'Business Plan', amount: 15000 },
  advanced: { name: 'Advanced Plan', amount: 28000 },
};

/**
 * Get the project limit for a given plan.
 * Returns -1 for unlimited.
 */
function getProjectLimit(plan) {
  return PLAN_LIMITS[plan]?.maxProjects ?? PLAN_LIMITS.free.maxProjects;
}

module.exports = { PLAN_LIMITS, PLAN_PRICING, getProjectLimit };
