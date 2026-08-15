"use client";

import { motion } from "motion/react";

const TICKETS_URL = "https://centurycinemax.co.ke/movie/show/garden/anam%27s_wake";
const BRANCHES = ["Two Rivers", "Junction", "Garden City", "Sarit"];

export default function Footer() {
  return (
    <footer
      id="tickets"
      className="relative flex min-h-screen w-full snap-start flex-col justify-center overflow-hidden bg-void-950 px-6 py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(224,180,102,0.08),transparent_70%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mx-auto max-w-xl text-center"
      >
        <span className="text-[11px] uppercase tracking-widest2 text-ember-500">
          Now Premiering
        </span>
        <h2 className="mt-3 font-display text-4xl font-light text-bone-100 sm:text-5xl">
          Anam&rsquo;s Wake
        </h2>
        <p className="mt-3 text-sm text-bone-500">
          Now showing at Century Cinemax &mdash; {BRANCHES.join(" · ")}.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ember-500 px-8 py-3 text-sm font-medium uppercase tracking-wide text-void-950 transition hover:bg-ember-400"
          >
            Get Tickets
          </a>
          <a
            href="https://youtu.be/Oa21_322Wg8"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-bone-100/30 px-8 py-3 text-sm font-medium uppercase tracking-wide text-bone-100 transition hover:border-bone-100/70"
          >
            Watch Trailer
          </a>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto mt-20 max-w-3xl text-center text-xs leading-relaxed text-bone-500">
        <p>
          Powered by CcHub&rsquo;s Creative Economy Practice, in partnership
          with Africa No Filter, supported by the Gates Foundation.
        </p>
        <p className="mt-1 tracking-wide">#DropTheShould &nbsp;#AnamsWakeFilm</p>
      </div>

      <div className="relative z-10 mx-auto mt-12 flex max-w-4xl flex-col items-center justify-between gap-4 border-t border-bone-500/10 pt-8 text-xs text-bone-500 sm:flex-row">
        <span>&copy; {new Date().getFullYear()} Anam&rsquo;s Wake. All rights reserved.</span>
        <div className="flex gap-5">
          <a
            href="https://www.imdb.com/title/tt41299201/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-bone-100"
          >
            IMDb
          </a>
          <a
            href="https://kenyabuzz.com/lifestyle/anams-wake-a-haunting-kenyan-thriller-about-the-grief-we-carry"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-bone-100"
          >
            KenyaBuzz
          </a>
          <a
            href="https://youtu.be/Oa21_322Wg8"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-bone-100"
          >
            Trailer
          </a>
        </div>
      </div>
    </footer>
  );
}
