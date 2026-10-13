import type { TranslationKey } from '@/lib/i18n/translations';

export interface OnboardingStep {
  id: string;
  route: '/profile' | '/settings' | '/dashboard';
  /** Selector CSS target highlight. null = modal tengah, tanpa highlight. */
  selector: string | null;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

export const ONBOARDING_DONE_KEY = 'jhos_onboarding_v2_done';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    route: '/profile',
    selector: null,
    titleKey: 'ob_welcome_title',
    bodyKey: 'ob_welcome_body',
  },
  {
    id: 'profile-name',
    route: '/profile',
    selector: '[data-onboard="profile-name"]',
    titleKey: 'ob_name_title',
    bodyKey: 'ob_name_body',
  },
  {
    id: 'profile-skills',
    route: '/profile',
    selector: '[data-onboard="profile-skills"]',
    titleKey: 'ob_skills_title',
    bodyKey: 'ob_skills_body',
  },
  {
    id: 'profile-portfolio',
    route: '/profile',
    selector: '[data-onboard="profile-portfolio"]',
    titleKey: 'ob_portfolio_title',
    bodyKey: 'ob_portfolio_body',
  },
  {
    id: 'settings-titles',
    route: '/settings',
    selector: '[data-onboard="settings-titles"]',
    titleKey: 'ob_titles_title',
    bodyKey: 'ob_titles_body',
  },
  {
    id: 'settings-locations',
    route: '/settings',
    selector: '[data-onboard="settings-locations"]',
    titleKey: 'ob_locations_title',
    bodyKey: 'ob_locations_body',
  },
  {
    id: 'settings-portals',
    route: '/settings',
    selector: '[data-onboard="settings-portals"]',
    titleKey: 'ob_portals_title',
    bodyKey: 'ob_portals_body',
  },
  {
    id: 'done',
    route: '/dashboard',
    selector: null,
    titleKey: 'ob_done_title',
    bodyKey: 'ob_done_body',
  },
];
