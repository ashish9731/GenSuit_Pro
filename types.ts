export enum AppView {
  HOME = 'HOME',
  AUTH = 'AUTH',
  EMAIL_DRAFTER = 'EMAIL_DRAFTER',
  ANALYTICS = 'ANALYTICS',
  DOC_CHAT = 'DOC_CHAT',
  LEARNING = 'LEARNING',
}

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface SalesDataRow {
  [key: string]: string | number;
}

export interface KPI {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AnalyticsReport {
  kpis: KPI[];
  
  // Time-based Analysis
  dailySummary: string;
  weeklySummary: string;
  monthlySummary: string;
  
  // Advanced Insights
  strategicRecommendations: string[];
  forecast: string;
  
  // Chart Data
  revenueTrend: { date: string; value: number }[];
  productDistribution: { name: string; value: number }[];

  // Team Deep Dive
  personnelAnalysis: {
    name: string;
    performanceScore: number;
    revenueGenerated: string;
    salesCount: number;
    keyStrength: string;
    areaForImprovement: string;
    actionPlan: string;
  }[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CourseModule {
  id: string;
  title: string;
  content: string;
}