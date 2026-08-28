"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import * as THREE from "three";
import {
  fitPixelCamera,
  hasWebGL,
  loadPlaneTexture,
  makeImagePlaneMaterial,
} from "./gl/imagePlane";
import EmberField from "./EmberField";

const GENRES = ["Drama", "Mystery", "Thriller"];
const TICKETS_URL = "https://centurycinemax.co.ke/movie/show/garden/anam%27s_wake";

export default function Hero() {
  const ref = useRef(null);
  const mountRef = useRef(null);
  const [glReady, setGlReady] = useState(false);

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

  useEffect(() => {
    const mount = mountRef.current;
    const section = ref.current;
    if (!mount || !section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!hasWebGL()) return;

    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    mount.appendChild(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      mount.removeChild(canvas);
      return;
    }

    let alive = true;
    let width = section.clientWidth;
    let height = section.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);

    const resize = () => {
      width = section.clientWidth;
      height = section.clientHeight;
      renderer.setSize(width, height, false);
      fitPixelCamera(camera, width, height);
    };
    resize();

    // Backdrop plane, oversized so the parallax shift never reveals an edge.
    const geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    const material = makeImagePlaneMaterial({ uVignette: 0, uBow: 0.5 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);

    const loader = new THREE.TextureLoader();
    loadPlaneTexture(loader, "/still-1.jpg", (tex) => {
      if (!alive) {
        tex.dispose();
        return;
      }
      material.uniforms.uTexture.value = tex;
      const img = tex.image;
      material.uniforms.uImageRes.value.set(
        img.naturalWidth || img.width,
        img.naturalHeight || img.height
      );
      mesh.userData.loaded = true;
      setGlReady(true);
    });
    const readyFallback = setTimeout(() => alive && setGlReady(true), 2000);

    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    const onScroll = () => {
      const y = window.scrollY;
      scrollVel += y - lastScrollY;
      lastScrollY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    let onScreen = true;
    let frameId = null;
    const clock = new THREE.Clock();

    const render = () => {
      frameId = requestAnimationFrame(render);
      const t = clock.getElapsedTime();
      scrollVel *= 0.82;
      const vel = THREE.MathUtils.clamp(scrollVel * 0.01, -1, 1);
      const p = Math.min(1, Math.max(0, progress.get()));

      const planeW = width * 1.15;
      const planeH = height * 1.28;
      mesh.scale.set(planeW, planeH, 1);
      mesh.position.y = -(p * 0.18 * height);

      const u = material.uniforms;
      u.uPlaneRes.value.set(planeW, planeH);
      u.uTime.value = t;
      u.uVelocity.value += (vel - u.uVelocity.value) * 0.2;
      u.uAlpha.value +=
        ((mesh.userData.loaded ? 0.42 : 0) - u.uAlpha.value) * 0.06;
      mesh.visible = u.uAlpha.value > 0.005;

      renderer.render(scene, camera);

      if (!onScreen && Math.abs(scrollVel) < 0.4) {
        cancelAnimationFrame(frameId);
        frameId = null;
        renderer.clear();
      }
    };

    const start = () => {
      if (frameId == null && alive) {
        lastScrollY = window.scrollY;
        render();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(section);
    start();

    return () => {
      alive = false;
      clearTimeout(readyFallback);
      if (frameId != null) cancelAnimationFrame(frameId);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      material.uniforms.uTexture.value?.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, [progress]);

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
          className={`object-cover transition-opacity duration-1000 ${
            glReady ? "opacity-0" : "opacity-30"
          }`}
        />
      </motion.div>
      <div
        ref={mountRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
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
          className="mb-4 rounded-full border border-ember-500/40 px-4 py-1.5 text-[11px] uppercase tracking-widest2 text-ember-400 sm:mb-6"
        >
          Now Premiering
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-shadow-glow font-display text-5xl font-light tracking-wide text-bone-100 sm:text-7xl md:text-8xl"
        >
          Anam&rsquo;s Wake
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:mt-6"
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
          className="mt-5 font-display text-lg italic text-ember-400 sm:mt-8 sm:text-2xl"
        >
          &ldquo;Death isn&rsquo;t the end, it&rsquo;s a negotiation.&rdquo;
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.15 }}
          className="mt-3 max-w-xl text-balance font-body text-sm leading-relaxed text-bone-300 sm:mt-5 sm:text-lg"
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
          className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4"
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
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-bone-500 sm:flex"
      >
        <span className="text-[10px] uppercase tracking-widest2">Scroll</span>
        <span className="h-8 w-px animate-drift bg-gradient-to-b from-bone-500 to-transparent" />
      </motion.div>
    </section>
  );
}
