'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ONBOARDING_DONE_KEY, ONBOARDING_STEPS } from '@/lib/onboarding/steps';

interface OnboardingContextType {
  active: boolean;
  stepIndex: number;
  step: (typeof ONBOARDING_STEPS)[number];
  start: (force?: boolean) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  active: false,
  stepIndex: 0,
  step: ONBOARDING_STEPS[0],
  start: () => {},
  next: () => {},
  back: () => {},
  skip: () => {},
});

function readDone(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_DONE_KEY) === '1';
}

function writeDone() {
  localStorage.setItem(ONBOARDING_DONE_KEY, '1');
}

export function OnboardingProvider({
  children,
  profileIncomplete,
}: {
  children: React.ReactNode;
  profileIncomplete: boolean;
}) {
  const [active, setActive] = useState(() => !readDone() && profileIncomplete);
  const [stepIndex, setStepIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const step = ONBOARDING_STEPS[stepIndex];

  const finish = useCallback(() => {
    writeDone();
    setActive(false);
    setStepIndex(0);
  }, []);

  const start = useCallback(
    (force = false) => {
      if (!force && readDone()) return;
      setStepIndex(0);
      setActive(true);
      router.push(ONBOARDING_STEPS[0].route);
    },
    [router]
  );

  const next = useCallback(() => {
    const last = stepIndex >= ONBOARDING_STEPS.length - 1;
    if (last) {
      finish();
      return;
    }
    const target = ONBOARDING_STEPS[stepIndex + 1];
    setStepIndex(stepIndex + 1);
    if (target.route !== pathname) {
      router.push(target.route);
    }
  }, [stepIndex, pathname, router, finish]);

  const back = useCallback(() => {
    if (stepIndex === 0) return;
    const target = ONBOARDING_STEPS[stepIndex - 1];
    setStepIndex(stepIndex - 1);
    if (target.route !== pathname) {
      router.push(target.route);
    }
  }, [stepIndex, pathname, router]);

  const value = useMemo(
    () => ({ active, stepIndex, step, start, next, back, skip: finish }),
    [active, stepIndex, step, start, next, back, finish]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
