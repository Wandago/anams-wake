"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import EmberField from "./EmberField";

const GENRES = ["Drama", "Mystery", "Thriller"];
const TICKETS_URL = "https://centurycinemax.co.ke/movie/show/garden/anam%27s_wake";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    mass: 0.4,
  });

  const bgY = useTransform(progress, [0, 1], ["0%", "18%"]);
  const contentOpacity = useTransform(progress, [0, 0.8], [1, 0]);
  const contentY = useTransform(progress, [0, 1], [0, -60]);

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex h-[100svh] min-h-[640px] w-full snap-start snap-always items-center justify-center overflow-hidden bg-void-950"
    >
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <Image
          src="/still-1.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(138,35,49,0.14),transparent_60%)]" />
      <EmberField />
      <div className="absolute inset-0 bg-gradient-to-b from-void-950/70 via-void-950/50 to-void-950" />

      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 rounded-full border border-ember-500/40 px-4 py-1.5 text-[11px] uppercase tracking-widest2 text-ember-400"
        >
          Now Premiering
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-shadow-glow font-display text-6xl font-light tracking-wide text-bone-100 sm:text-7xl md:text-8xl"
        >
          Anam&rsquo;s Wake
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
        >
          {GENRES.map((g) => (
            <span
              key={g}
              className="rounded-full border border-bone-500/30 px-4 py-1 text-sm text-bone-300"
            >
              {g}
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.0 }}
          className="mt-8 font-display text-xl italic text-ember-400 sm:text-2xl"
        >
          &ldquo;Death isn&rsquo;t the end, it&rsquo;s a negotiation.&rdquo;
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.15 }}
          className="mt-5 max-w-xl text-balance font-body text-base leading-relaxed text-bone-300 sm:text-lg"
        >
          In a world where Death can be summoned to negotiate for the dead, a
          young professional mourner is sent to guide a wealthy family
          through a wake &mdash; only to discover Death has come for more
          than their patriarch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ember-500 px-7 py-3 text-sm font-medium uppercase tracking-wide text-void-950 transition hover:bg-ember-400"
          >
            Get Tickets
          </a>
          <a
            href="#trailer"
            className="rounded-full border border-bone-100/30 px-7 py-3 text-sm font-medium uppercase tracking-wide text-bone-100 transition hover:border-bone-100/70"
          >
            Watch Trailer
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-bone-500"
      >
        <span className="text-[10px] uppercase tracking-widest2">Scroll</span>
        <span className="h-8 w-px animate-drift bg-gradient-to-b from-bone-500 to-transparent" />
      </motion.div>
    </section>
  );
}
