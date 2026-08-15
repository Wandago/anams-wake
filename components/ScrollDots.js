"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "poster", label: "Poster" },
  { id: "story", label: "Story" },
  { id: "cast", label: "Cast" },
  { id: "gallery", label: "Gallery" },
  { id: "trailer", label: "Trailer" },
  { id: "tickets", label: "Tickets" },
];

export default function ScrollDots() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    const els = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      Boolean
    );
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 sm:flex"
    >
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-label={label}
          aria-current={active === id ? "true" : undefined}
          className="group relative flex h-4 w-4 items-center justify-center"
        >
          <span
            className={`block rounded-full transition-all duration-300 ${
              active === id
                ? "h-2.5 w-2.5 bg-ember-400 shadow-[0_0_8px_rgba(224,180,102,0.7)]"
                : "h-1.5 w-1.5 bg-bone-500/40 group-hover:bg-bone-300"
            }`}
          />
          <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded bg-void-900/90 px-2 py-1 text-[10px] uppercase tracking-wide text-bone-300 opacity-0 backdrop-blur transition group-hover:opacity-100">
            {label}
          </span>
        </a>
      ))}
    </nav>
  );
}
