import { useEffect, useRef, useState } from "react";

type Direction = "horizontal" | "vertical";

export function useScrollFade<T extends HTMLElement = HTMLElement>(
  direction: Direction = "horizontal"
) {
  const ref = useRef<T | null>(null); // ✅ generic — infers HTMLDivElement at call site

  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  const updateFades = () => {
    const el = ref.current;
    if (!el) return;

    if (direction === "horizontal") {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowStartFade(scrollLeft > 0);
      setShowEndFade(scrollLeft < scrollWidth - clientWidth - 1);
    } else {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowStartFade(scrollTop > 0);
      setShowEndFade(scrollTop < scrollHeight - clientHeight - 1);
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateFades();

    el.addEventListener("scroll", updateFades);
    window.addEventListener("resize", updateFades);

    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
      resizeObserver.disconnect();
    };
  }, [direction]);

  return { ref, showStartFade, showEndFade };
}