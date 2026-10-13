'use client';

import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useOnboarding } from '@/components/onboarding/provider';
import { ONBOARDING_STEPS } from '@/lib/onboarding/steps';
import { useLanguage } from '@/lib/i18n/context';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function queryTarget(selector: string | null): HTMLElement | null {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
}

function waitForTarget(selector: string | null, timeoutMs = 3000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    if (!selector) return resolve(null);
    const found = queryTarget(selector);
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = queryTarget(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(queryTarget(selector));
    }, timeoutMs);
  });
}

export function OnboardingSpotlight() {
  const { active, stepIndex, step, next, back, skip } = useOnboarding();
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const [prevStepKey, setPrevStepKey] = useState(`${stepIndex}-${pathname}`);

  // Reset ready/rect during render if step or pathname changed
  const currentStepKey = `${stepIndex}-${pathname}`;
  if (prevStepKey !== currentStepKey) {
    setPrevStepKey(currentStepKey);
    setReady(false);
    setRect(null);
  }

  // Lock scroll by freezing body at current position
  useEffect(() => {
    if (!active) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Prevent wheel, touch, and scroll keys
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const preventScrollKeys = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });
    window.addEventListener('keydown', preventScrollKeys);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('wheel', preventDefault);
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('keydown', preventScrollKeys);
    };
  }, [active]);

  const measureElement = useCallback((el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setRect({
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    });
    setReady(true);
  }, []);

  // Position highlight when step changes
  useLayoutEffect(() => {
    if (!active) return;

    let cancelled = false;

    waitForTarget(step.selector).then((el) => {
      if (cancelled) return;

      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });

        requestAnimationFrame(() => {
          if (cancelled) return;
          measureElement(el);
        });
      } else {
        setRect(null);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [active, stepIndex, pathname, step.selector, measureElement]);

  // Re-measure on window resize
  useEffect(() => {
    if (!active) return;

    const handleResize = () => {
      if (!step.selector) return;
      const el = queryTarget(step.selector);
      if (el) {
        measureElement(el);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [active, step.selector, measureElement]);

  // Escape key to skip
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, skip]);

  if (!active || !ready) return null;

  const total = ONBOARDING_STEPS.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  // Tooltip positioning based on viewport space
  let tooltipStyle: React.CSSProperties = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    position: 'absolute',
  };

  if (rect) {
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const spaceAbove = rect.top;

    let topPos: number;
    if (spaceBelow >= 210) {
      // Place below target
      topPos = rect.top + rect.height + 12;
    } else if (spaceAbove >= 210) {
      // Place above target
      topPos = rect.top - 200;
    } else {
      // Place wherever has more space, clamped
      topPos = spaceBelow > spaceAbove ? rect.top + rect.height + 8 : Math.max(12, rect.top - 180);
    }

    topPos = Math.max(12, Math.min(topPos, window.innerHeight - 240));

    // Follow target horizontally so tooltip stays near highlight on wide screens.
    const tooltipWidth = Math.min(384, window.innerWidth - 32);
    const leftPos = Math.max(
      16,
      Math.min(rect.left, window.innerWidth - tooltipWidth - 16)
    );

    tooltipStyle = {
      top: topPos,
      left: leftPos,
      width: tooltipWidth,
      position: 'absolute',
    };
  }

  return (
    <div
      className="fixed inset-0 z-[90] pointer-events-auto select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Block all clicks to elements behind overlay
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Spotlight cutout border & dark shadow */}
      {rect ? (
        <div
          className="absolute rounded-sm border-2 border-[#C1EF7B] pointer-events-auto transition-all duration-150"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px rgba(12, 11, 30, 0.70)',
          }}
          onClick={(e) => {
            // Absorb clicks on the cutout itself
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#0C0B1E]/70" />
      )}

      {/* Tooltip Card */}
      <div
        className="pointer-events-auto w-[calc(100%-2rem)] max-w-sm rounded-sm border border-[#a5df48] bg-white p-4 shadow-2xl z-10"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          {language === 'id' ? 'Panduan' : 'Guide'} {stepIndex + 1}/{total}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-[#0C0B1E]">{t(step.titleKey)}</h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-700">{t(step.bodyKey)}</p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={skip}
            className="font-mono text-[11px] text-zinc-500 hover:text-[#0C0B1E] hover:underline cursor-pointer"
          >
            {language === 'id' ? 'Lewati' : 'Skip'}
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="rounded-sm border border-zinc-300 bg-white px-3 py-1.5 font-mono text-[11px] font-semibold text-[#0C0B1E] hover:bg-[#F1F0FF] cursor-pointer"
              >
                ‹ {language === 'id' ? 'Kembali' : 'Back'}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-sm bg-[#0C0B1E] px-3.5 py-1.5 font-mono text-[11px] font-bold text-[#C1EF7B] hover:bg-[#1a1936] cursor-pointer"
            >
              {isLast ? (language === 'id' ? 'Mulai ✓' : 'Start ✓') : (language === 'id' ? 'Lanjut ›' : 'Next ›')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
