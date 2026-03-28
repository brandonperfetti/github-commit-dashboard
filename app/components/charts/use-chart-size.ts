"use client";

import { useCallback, useEffect, useState } from "react";

export function useChartSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useCallback((node: T | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }

    const updateSize = () => {
      const next = element.getBoundingClientRect();
      const width = Math.max(0, Math.floor(next.width));
      const height = Math.max(0, Math.floor(next.height));

      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return { ref, size, ready: size.width > 0 && size.height > 0 };
}
