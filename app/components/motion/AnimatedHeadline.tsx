"use client";

import { gsap } from "gsap";
import { useEffect, useMemo, useRef } from "react";
import {
  HEADLINE_DEFAULT_DELAY,
  LINE_WORD_DURATION,
  LINE_WORD_STAGGER,
  TYPEWRITER_CARET_BLINK_DURATION,
  TYPEWRITER_CARET_START_BUFFER,
  TYPEWRITER_CHAR_DURATION,
  TYPEWRITER_CHAR_STAGGER,
} from "@/lib/motion/headlineTiming";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

type HeadlineTag = "h1" | "h2" | "h3";

export function AnimatedHeadline({
  text,
  as = "h1",
  className,
  variant = "line",
  delay = HEADLINE_DEFAULT_DELAY,
}: {
  text: string;
  as?: HeadlineTag;
  className?: string;
  variant?: "typewriter" | "line";
  delay?: number;
}) {
  const rootRef = useRef<HTMLHeadingElement | null>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const words = useMemo(() => text.trim().split(/\s+/), [text]);
  const charGroups = useMemo(
    () => words.map((word) => Array.from(word)),
    [words],
  );

  useEffect(() => {
    if (prefersReducedMotion || !rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      if (variant === "typewriter") {
        const characterNodes = Array.from(
          rootRef.current?.querySelectorAll("[data-char]") ?? [],
        );
        const timeline = gsap.timeline();
        timeline.fromTo(
          characterNodes,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: TYPEWRITER_CHAR_DURATION,
            stagger: TYPEWRITER_CHAR_STAGGER,
            ease: "none",
            delay,
          },
        );

        if (caretRef.current) {
          // Blink the caret by fading to 0 with yoyo back to 1 (via startAt),
          // timed to start after the typewriter pass:
          // chars * TYPEWRITER_CHAR_STAGGER + TYPEWRITER_CARET_START_BUFFER.
          gsap.set(caretRef.current, { autoAlpha: 0 });
          gsap.to(caretRef.current, {
            autoAlpha: 0,
            repeat: -1,
            yoyo: true,
            duration: TYPEWRITER_CARET_BLINK_DURATION,
            ease: "none",
            delay:
              delay +
              characterNodes.length * TYPEWRITER_CHAR_STAGGER +
              TYPEWRITER_CARET_START_BUFFER,
            startAt: { autoAlpha: 1 },
          });
        }

        return;
      }

      const wordNodes = Array.from(
        rootRef.current?.querySelectorAll("[data-word]") ?? [],
      );
      gsap.fromTo(
        wordNodes,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: LINE_WORD_DURATION,
          stagger: LINE_WORD_STAGGER,
          ease: "power2.out",
          delay,
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, [delay, prefersReducedMotion, text, variant]);

  const Component = as;

  if (prefersReducedMotion) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component ref={rootRef} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline">
        {variant === "typewriter"
          ? charGroups.map((wordChars, wordIndex) => (
              <span
                key={`word-${wordIndex}`}
                className={`inline-block ${wordIndex < charGroups.length - 1 ? "mr-[0.28em]" : ""}`}
              >
                {wordChars.map((char, charIndex) => (
                  <span
                    key={`${wordIndex}-${char}-${charIndex}`}
                    data-char
                    className="inline-block will-change-[opacity]"
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))
          : words.map((word, index) => (
              <span key={`${word}-${index}`} className="inline-block">
                <span data-word className="inline-block will-change-transform">
                  {word}
                </span>
                {index < words.length - 1 && "\u00A0"}
              </span>
            ))}
      </span>
      {variant === "typewriter" && (
        <span ref={caretRef} aria-hidden="true" className="inline-block w-0">
          <span className="ml-[0.14em] inline-block align-baseline text-emerald-500">
            |
          </span>
        </span>
      )}
    </Component>
  );
}
