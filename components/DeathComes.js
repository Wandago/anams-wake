"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

const BEATS = [
  {
    image: "/still-2.jpg",
    glow: "rgba(224,180,102,0.14)",
    kicker: "The Custom",
    line: "Death can be summoned — to negotiate for the dead.",
  },
  {
    image: "/still-4.jpg",
    glow: "rgba(163,129,47,0.16)",
    kicker: "The Guide",
    line: "A young mourner is sent to lead a wealthy family through the wake.",
  },
  {
    image: "/still-6.jpg",
    glow: "rgba(138,35,49,0.3)",
    kicker: "The Reveal",
    line: "But Death has come for more than their patriarch.",
    emphasis: true,
  },
];

function Beat({ beat, index, total, progress }) {
  const start = index / total;
  const end = (index + 1) / total;
  const margin = (end - start) * 0.15;
  const fadeIn = start + margin;
  const fadeOut = end - margin;

  const opacity = useTransform(
    progress,
    [start, fadeIn, fadeOut, end],
    [index === 0 ? 1 : 0, 1, 1, index === total - 1 ? 1 : 0]
  );
  const scale = useTransform(progress, [start, end], [1, 1.08]);
  const textY = useTransform(progress, [start, fadeIn], [24, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden px-6"
    >
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image
          src={beat.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
      </motion.div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${beat.glow}, transparent 65%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-void-900/55"
      />
      <motion.div
        style={{ y: textY }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <span className="mb-5 block text-[11px] uppercase tracking-widest2 text-ember-500">
          {String(index + 1).padStart(2, "0")} &mdash; {beat.kicker}
        </span>
        <p
          className={`font-display text-3xl font-light leading-snug text-shadow-glow sm:text-4xl md:text-5xl ${
            beat.emphasis ? "text-wake-500" : "text-bone-100"
          }`}
        >
          {beat.line}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function DeathComes() {
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

  return (
    <section
      ref={ref}
      id="story"
      className="relative h-[300vh] w-full snap-start bg-void-900"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {BEATS.map((beat, i) => (
          <Beat
            key={beat.kicker}
            beat={beat}
            index={i}
            total={BEATS.length}
            progress={progress}
          />
        ))}
      </div>
    </section>
  );
}
