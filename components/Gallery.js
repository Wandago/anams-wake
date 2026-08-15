"use client";

import Image from "next/image";
import { motion } from "motion/react";

const PHOTOS = [
  { src: "/still-3.jpg", tag: "Still" },
  { src: "/still-5.jpg", tag: "Still" },
  { src: "/bts-1.jpg", tag: "Behind the Scenes" },
  { src: "/bts-5.jpg", tag: "Behind the Scenes" },
  { src: "/bts-2.jpg", tag: "Behind the Scenes" },
  { src: "/bts-4.jpg", tag: "Behind the Scenes" },
  { src: "/bts-3.jpg", tag: "Behind the Scenes" },
];

export default function Gallery() {
  return (
    <section className="bg-void-950 px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="text-[11px] uppercase tracking-widest2 text-ember-500">
            On Set
          </span>
          <h2 className="mt-3 font-display text-4xl font-light text-bone-100 sm:text-5xl">
            Behind the Wake
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PHOTOS.map((photo, i) => (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className={`group relative aspect-video overflow-hidden rounded-sm ${
                i === 0 ? "col-span-2 sm:col-span-2 sm:row-span-2 aspect-square sm:aspect-auto" : ""
              }`}
            >
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-950/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-void-950/70 px-2.5 py-1 text-[10px] uppercase tracking-wide text-bone-300 opacity-0 backdrop-blur transition group-hover:opacity-100">
                {photo.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
