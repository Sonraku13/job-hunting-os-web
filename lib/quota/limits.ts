export const QUOTA_LIMITS = {
  FREE: {
    AI: 3,
    SCRAPE: 1,
  },
  PRO: {
    AI: 30,
    SCRAPE: 10,
  },
  VIP: {
    AI: 100,
    SCRAPE: 25,
  },
  ADMIN: {
    AI: 999999,
    SCRAPE: 999999,
  },
} as const;

export type PlanType = 'FREE' | 'PRO' | 'VIP' | 'ADMIN';
export type UsageAction = 'AI_EXTRACT' | 'AI_GENERATE' | 'SCRAPE_LINKEDIN' | 'SCRAPE_JOBSTREET' | 'SCRAPE_INDEED' | 'SCRAPE_GLINTS' | 'SCRAPE_DEALLS';

export const AI_ACTIONS: UsageAction[] = ['AI_EXTRACT', 'AI_GENERATE'];

export const SCRAPE_ACTIONS: UsageAction[] = [
  'SCRAPE_LINKEDIN',
  'SCRAPE_JOBSTREET',
  'SCRAPE_INDEED',
  'SCRAPE_GLINTS',
  'SCRAPE_DEALLS',
];

export const ALL_USAGE_ACTIONS: UsageAction[] = [...AI_ACTIONS, ...SCRAPE_ACTIONS];

export const SCRAPE_PORTALS = ['linkedin', 'jobstreet', 'indeed', 'glints', 'dealls'] as const;
export type ScrapePortal = (typeof SCRAPE_PORTALS)[number];

export const SCRAPE_ACTION_BY_PORTAL: Record<ScrapePortal, UsageAction> = {
  linkedin: 'SCRAPE_LINKEDIN',
  jobstreet: 'SCRAPE_JOBSTREET',
  indeed: 'SCRAPE_INDEED',
  glints: 'SCRAPE_GLINTS',
  dealls: 'SCRAPE_DEALLS',
};
