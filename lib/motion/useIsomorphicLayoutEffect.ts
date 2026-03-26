import { useEffect, useLayoutEffect } from "react";

/**
 * SSR-safe layout effect alias.
 * Uses `useLayoutEffect` in the browser and falls back to `useEffect` on the server.
 */
export const useIsomorphicLayoutEffect: typeof useLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
