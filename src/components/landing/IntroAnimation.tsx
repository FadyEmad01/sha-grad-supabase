"use client"

import { motion, AnimatePresence } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import useScreenSize from "@/hooks/use-screen-size"
import { easings, durations, transitions, makeTransition } from "@/lib/animation-config"
import Counter from "@/components/landing/counter"
import HeroSection from "./Hero"

type Phase = "idle" | "revealing" | "expanding" | "exiting" | "done"

const FONT_SIZE = { mobile: 30, desktop: 72 } as const
const COUNTER_START = 2003
const COUNTER_END = 2026

export default function IntroAnimation() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const [counterValue, setCounterValue] = useState(COUNTER_START)
  const [imageBounds, setImageBounds] = useState<DOMRect | null>(null)

  const mediaRef = useRef<HTMLDivElement>(null)
  const revealHandled = useRef(false)

  const screenSize = useScreenSize()
  const isMobile = screenSize.lessThan("sm")
  const fontSize = isMobile ? FONT_SIZE.mobile : FONT_SIZE.desktop

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // If the animation isn't done, lock the scroll
    if (phase !== "done") {
      document.body.style.overflow = "hidden";
      // Optional: prevents layout jump if the scrollbar disappears
      document.body.style.paddingRight = "var(--removed-body-scroll-bar-size)";
    } else {
      // Re-enable scroll when done
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    // Cleanup function: ensures scroll is restored if the 
    // component unmounts before the animation finishes
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [phase]);

  useEffect(() => {
    const id = setTimeout(() => {
      setPhase("revealing")
      setTimeout(() => setCounterValue(COUNTER_END), 120)
    }, 1000)
    return () => clearTimeout(id)
  }, [])

  const handleRevealComplete = useCallback((definition: unknown) => {
    if (definition !== "animate" || revealHandled.current) return
    revealHandled.current = true
    setTimeout(() => {
      if (mediaRef.current) {
        setImageBounds(mediaRef.current.getBoundingClientRect())
        setPhase("expanding")
      }
    }, 380)
  }, [])

  const handleOverlayComplete = useCallback(() => {
    if (phase === "expanding") {
      setTimeout(() => setPhase("exiting"), 300)
    } else if (phase === "exiting") {
      setPhase("done")
    }
  }, [phase])

  const isExpanding = phase === "expanding" || phase === "exiting"
  const showIntro = phase !== "done"

  // ── Variants ───────────────────────────────────────────────────────────────

  const revealVariants = {
    initial: {
      width: isMobile ? "160px" : "0px",
      height: isMobile ? "0px" : "300px",
    },
    animate: {
      width: isMobile ? "200px" : "330px",
      height: isMobile ? "200px" : "300px",
      transition: transitions.reveal,            // ← from config
    },
  }

  const leftSlide = isMobile
    ? { x: 0, y: -130, opacity: 0, filter: "blur(12px)" }
    : { x: -300, opacity: 0, filter: "blur(12px)" }

  const rightSlide = isMobile
    ? { x: 0, y: 130, opacity: 0, filter: "blur(12px)" }
    : { x: 300, opacity: 0, filter: "blur(12px)" }

  const textRest = { x: 0, y: 0, opacity: 1, filter: "blur(0px)" }

  const overlayAnimate =
    phase === "expanding"
      ? { top: 0, left: 0, width: "100vw", height: "100vh", clipPath: "inset(0% 0% 0% 0%)" }
      : phase === "exiting"
        ? { top: 0, left: 0, width: "100vw", height: "100vh", clipPath: "inset(0% 0% 100% 0%)", scale: 1.05 }
        : {}

  const overlayTransition =
    phase === "exiting"
      ? transitions.expand                        // ← replaces hardcoded [0.77, 0, 0.175, 1]
      : transitions.expand

  if (!mounted) return null

  return (
    <div className="w-dvw h-dvh relative overflow-hidden bg-[#f8f8f8]">

      {/* ── Main Hero 
       ────────────────────────────────── */}
      {phase === "done" && <HeroSection />}

      {/* ── Intro text ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            exit={{ opacity: 0 }}
            transition={transitions.gentle}         // ← from config
          >
            <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-4 font-medium">

              <motion.span
                className="text-3xl sm:text-7xl font-sans"
                animate={isExpanding ? leftSlide : textRest}
                transition={makeTransition("slideOut", 0.06)}  // ← helper
              >
                senior
              </motion.span>

              <motion.div
                ref={mediaRef}
                className="overflow-hidden pt-1"
                variants={revealVariants}
                initial="initial"
                animate={phase !== "idle" ? "animate" : "initial"}
                onAnimationComplete={handleRevealComplete}
                style={{ visibility: isExpanding ? "hidden" : "visible" }}
              >
                <img
                  src="/images/Hero.jpg"
                  alt="hero"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.span
                className="font-serif"
                animate={isExpanding ? rightSlide : textRest}
                transition={makeTransition("slideOut", 0.06)}  // ← helper
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <Counter
                  value={counterValue}
                  fontSize={fontSize}
                  places={[1000, 100, 10, 1]}
                  gap={0}
                  fontWeight="500"
                  textColor="currentColor"
                  counterStyle={{ fontStyle: "italic" }}
                  gradientFrom="#f8f8f8"
                  gradientTo="transparent"
                  gradientHeight={Math.round(fontSize * 0.25)}
                />
              </motion.span>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanding && imageBounds && (
          <motion.div
            className="absolute overflow-hidden"
            style={{ zIndex: 50 }}
            initial={{
              top: imageBounds.top,
              left: imageBounds.left,
              width: imageBounds.width,
              height: imageBounds.height,
              clipPath: "inset(0% 0% 0% 0%)",
            }}
            animate={overlayAnimate}
            transition={overlayTransition}
            onAnimationComplete={handleOverlayComplete}
          >
            <img
              src="/images/Hero.jpg"
              alt="hero"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}