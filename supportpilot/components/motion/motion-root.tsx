"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
