/**
 * Analytics type definitions for Stackly Analytics Dashboard.
 */

export interface AnalyticsEvent {
  id: string;
  page: string;
  timestamp: number;
  sessionId: string;
}

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  weeklyViews: number;
  dailyTraffic: DailyTraffic[];
  weeklyTraffic: WeeklyTraffic[];
  topPages: TopPage[];
  recentActivity: AnalyticsEvent[];
}

export interface DailyTraffic {
  date: string;
  views: number;
  visitors: number;
}

export interface WeeklyTraffic {
  week: string;
  views: number;
  visitors: number;
}

export interface TopPage {
  page: string;
  views: number;
  percentage: number;
}

export type AnalyticsDateFilter = "today" | "7days" | "30days";
