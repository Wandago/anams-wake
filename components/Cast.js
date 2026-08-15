"use client";

import { motion } from "motion/react";

// In IMDb credits order — https://www.imdb.com/title/tt41299201/fullcredits/
const CAST = [
  { character: "Anam", actor: "Marima Wanjiru" },
  { character: "Negotiator", actor: "Samson Omondi" },
  { character: "Mason Ebale", actor: "Peter Kawa" },
  { character: "Zuri Ebale", actor: "Gathoni Mutua" },
  { character: "Amani Ebale", actor: "Vanessa Okeyo" },
  { character: "James Ebale", actor: "Ben Teke" },
  { character: "Nyawira", actor: "Brenda Ngeso" },
  { character: "Aunt Kavata", actor: "Ruth Ringos" },
];

const FILMMAKERS = [
  { role: "Director / Writer", name: "Likarion Wainaina" },
  { role: "Producer", name: "Wanjiru Njoroge" },
  { role: "Cinematographer", name: "Enos Olik" },
  { role: "Editor", name: "Nicholas Kibathi" },
];

export default function Cast() {
  return (
    <section id="cast" className="bg-void-900 px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="text-[11px] uppercase tracking-widest2 text-ember-500">
            Who Gathers
          </span>
          <h2 className="mt-3 font-display text-4xl font-light text-bone-100 sm:text-5xl">
            Cast &amp; Crew
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {CAST.map((c, i) => (
            <motion.div
              key={c.character}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="group rounded-lg border border-bone-500/15 bg-void-800/60 p-5 transition hover:border-ember-500/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-bone-500/25 font-display text-lg text-ember-400">
                {c.character.charAt(0)}
              </div>
              <h3 className="font-display text-lg leading-tight text-bone-100">
                {c.character}
              </h3>
              <p className="mt-1 text-sm text-bone-500">{c.actor}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-bone-500/10 pt-10 text-center"
        >
          {FILMMAKERS.map((f) => (
            <div key={f.role}>
              <p className="text-[10px] uppercase tracking-widest2 text-ember-500">
                {f.role}
              </p>
              <p className="mt-1 font-display text-base text-bone-300">
                {f.name}
              </p>
            </div>
          ))}
        </motion.div>

        <p className="mt-10 text-center text-sm text-bone-500">
          <a
            href="https://www.imdb.com/title/tt41299201/fullcredits/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-bone-500/40 underline-offset-4 transition hover:text-ember-400"
          >
            Full cast &amp; crew on IMDb
          </a>
        </p>
      </div>
    </section>
  );
}
