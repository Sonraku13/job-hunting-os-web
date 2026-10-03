export const QUOTA_LIMITS = {
  FREE: {
    AI: 3,
    SCRAPE: 1,
  },
  PAID: {
    AI: 30,
    SCRAPE: 10,
  },
} as const;

export type PlanType = 'FREE' | 'PAID';
export type UsageAction = 'AI_EXTRACT' | 'AI_GENERATE' | 'SCRAPE_LINKEDIN' | 'SCRAPE_JOBSTREET';
