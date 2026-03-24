"use client";

import { useEffect, useRef, useState } from "react";

export function useChartSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const element = ref.current;
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
  }, []);

  return { ref, size, ready: size.width > 0 && size.height > 0 };
}
