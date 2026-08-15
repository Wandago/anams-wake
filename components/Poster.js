"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

export default function Poster() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    mass: 0.4,
  });

  const scale = useTransform(progress, [0, 0.55, 1], [0.72, 1.06, 1]);
  const rotate = useTransform(progress, [0, 0.55, 1], [-4, 0, 0]);
  const glowOpacity = useTransform(progress, [0, 0.5, 1], [0.35, 1, 0.7]);
  const labelOpacity = useTransform(progress, [0.55, 0.8], [0, 1]);
  const labelY = useTransform(progress, [0.55, 0.8], [12, 0]);

  return (
    <section
      ref={ref}
      id="poster"
      className="relative h-[200vh] w-full snap-start bg-void-950"
    >
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-24">
        <motion.div
          aria-hidden="true"
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(224,180,102,0.10),transparent_65%)]"
        />
        <motion.div
          style={{ scale, rotate }}
          className="relative z-10 w-full max-w-xs overflow-hidden rounded-sm border border-bone-500/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:max-w-sm"
        >
          <Image
            src="/poster.jpg"
            alt="Anam's Wake official poster"
            width={1013}
            height={1266}
            sizes="(min-width: 640px) 24rem, 20rem"
            className="h-auto w-full"
          />
        </motion.div>
        <motion.p
          style={{ opacity: labelOpacity, y: labelY }}
          className="relative z-10 mt-6 text-center text-[11px] uppercase tracking-widest2 text-bone-500"
        >
          Official Poster
        </motion.p>
      </div>
    </section>
  );
}
