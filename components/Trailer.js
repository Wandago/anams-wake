"use client";

import { motion } from "motion/react";

const TRAILER_EMBED_URL = "https://www.youtube.com/embed/Oa21_322Wg8";

export default function Trailer() {
  return (
    <section id="trailer" className="bg-void-950 px-6 py-28">
      <div className="mx-auto max-w-4xl text-center">
        <span className="text-[11px] uppercase tracking-widest2 text-ember-500">
          Watch
        </span>
        <h2 className="mt-3 font-display text-4xl font-light text-bone-100 sm:text-5xl">
          Trailer
        </h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto mt-10 aspect-video w-full overflow-hidden rounded-lg border border-bone-500/15 bg-void-800"
        >
          {TRAILER_EMBED_URL ? (
            <iframe
              src={TRAILER_EMBED_URL}
              title="Anam's Wake — Trailer"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_center,_rgba(138,35,49,0.18),transparent_70%)]">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-bone-100/30 text-bone-100">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <p className="text-sm uppercase tracking-widest2 text-bone-500">
                Trailer coming soon
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
