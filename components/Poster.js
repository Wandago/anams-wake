"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function Poster() {
  return (
    <section
      id="poster"
      className="relative flex min-h-screen w-full snap-start flex-col items-center justify-center overflow-hidden bg-void-950 px-6 py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(224,180,102,0.10),transparent_65%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-xs overflow-hidden rounded-sm border border-bone-500/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:max-w-sm"
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
      <p className="relative z-10 mt-6 text-center text-[11px] uppercase tracking-widest2 text-bone-500">
        Official Poster
      </p>
    </section>
  );
}
