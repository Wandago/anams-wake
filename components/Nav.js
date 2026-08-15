"use client";

export default function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
      <a href="#" className="font-display text-lg tracking-wide text-bone-100">
        Anam&rsquo;s Wake
      </a>
      <div className="hidden gap-8 text-xs uppercase tracking-widest2 text-bone-300 sm:flex">
        <a href="#trailer" className="transition hover:text-ember-400">Trailer</a>
        <a href="#cast" className="transition hover:text-ember-400">Cast</a>
        <a href="#tickets" className="transition hover:text-ember-400">More</a>
      </div>
    </nav>
  );
}
