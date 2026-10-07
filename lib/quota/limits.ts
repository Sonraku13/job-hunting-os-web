export const QUOTA_LIMITS = {
  FREE: {
    AI: 3,
    SCRAPE: 1,
  },
  PAID: {
    AI: 100,
    SCRAPE: 50,
  },
  ADMIN: {
    AI: 999999,
    SCRAPE: 999999,
  },
} as const;

export type PlanType = 'FREE' | 'PAID' | 'ADMIN';
export type UsageAction = 'AI_EXTRACT' | 'AI_GENERATE' | 'SCRAPE_LINKEDIN' | 'SCRAPE_JOBSTREET' | 'SCRAPE_INDEED' | 'SCRAPE_GLINTS' | 'SCRAPE_DEALLS';
