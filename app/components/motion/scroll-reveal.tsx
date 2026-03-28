"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import {
  SCROLL_REVEAL_DURATION,
  SCROLL_REVEAL_START,
  SCROLL_REVEAL_STAGGER,
  SCROLL_REVEAL_Y,
} from "@/lib/motion/headlineTiming";
import { useIsomorphicLayoutEffect } from "@/lib/motion/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

export function ScrollReveal({
  children,
  className,
  targets = "self",
  once = true,
  y = SCROLL_REVEAL_Y,
  duration = SCROLL_REVEAL_DURATION,
  stagger = SCROLL_REVEAL_STAGGER,
  start = SCROLL_REVEAL_START,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  targets?: string | "self";
  once?: boolean;
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  delay?: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    // Keep an immediate matchMedia check here to avoid a first-layout flicker
    // when the hook value is briefly stale during SSR/hydration. The hook value
    // remains the normal reactive source after mount. We also bail when the ref
    // is not ready so GSAP does not run against a null root.
    const prefersReducedMotionSync =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotionSync || prefersReducedMotion || !rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const elements =
        targets === "self"
          ? [rootRef.current].filter(Boolean)
          : gsap.utils.toArray<HTMLElement>(targets, rootRef.current);

      if (!elements.length) {
        return;
      }

      gsap.set(elements, { autoAlpha: 0, y });
      gsap.to(elements, {
        autoAlpha: 1,
        y: 0,
        duration,
        delay,
        stagger: elements.length > 1 ? stagger : 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start,
          once,
          toggleActions: once
            ? "play none none none"
            : "play none none reverse",
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [delay, duration, once, prefersReducedMotion, stagger, start, targets, y]);

  return (
    <div ref={rootRef} className={cn(className)}>
      {children}
    </div>
  );
}
