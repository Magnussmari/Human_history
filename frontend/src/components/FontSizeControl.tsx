"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const MIN_SCALE = 0.85;
const MAX_SCALE = 1.4;
const STEP = 0.075;
const STORAGE_KEY = "font-scale";
const DEFAULT_SCALE = 1.0;

export function FontSizeControl() {
  const [scale, setScale] = useState(DEFAULT_SCALE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= MIN_SCALE && val <= MAX_SCALE) {
        setScale(val);
        document.documentElement.style.setProperty("--font-scale", String(val));
        document.documentElement.style.fontSize = `${val * 100}%`;
      }
    }
  }, []);

  const applyScale = (next: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(next * 100) / 100));
    setScale(clamped);
    document.documentElement.style.setProperty("--font-scale", String(clamped));
    // Scale the root font-size so ALL rem-based sizes respond
    document.documentElement.style.fontSize = `${clamped * 100}%`;
    localStorage.setItem(STORAGE_KEY, String(clamped));
  };

  return (
    <div className="flex items-center gap-0.5">
      <motion.button
        onClick={() => applyScale(scale - STEP)}
        disabled={scale <= MIN_SCALE}
        className="h-7 w-7 rounded-md border border-border/50 bg-muted/30 flex items-center justify-center text-xs font-mono text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        whileTap={{ scale: 0.88 }}
        aria-label="Decrease font size"
      >
        A−
      </motion.button>
      <motion.button
        onClick={() => applyScale(scale + STEP)}
        disabled={scale >= MAX_SCALE}
        className="h-7 w-7 rounded-md border border-border/50 bg-muted/30 flex items-center justify-center text-sm font-mono text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        whileTap={{ scale: 0.88 }}
        aria-label="Increase font size"
      >
        A+
      </motion.button>
    </div>
  );
}
