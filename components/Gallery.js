"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import * as THREE from "three";
import {
  fitPixelCamera,
  hasWebGL,
  loadPlaneTexture,
  makeImagePlaneMaterial,
} from "./gl/imagePlane";

const PHOTOS = [
  { src: "/still-3.jpg", tag: "Still" },
  { src: "/still-5.jpg", tag: "Still" },
  { src: "/bts-1.jpg", tag: "Behind the Scenes" },
  { src: "/bts-5.jpg", tag: "Behind the Scenes" },
  { src: "/bts-2.jpg", tag: "Behind the Scenes" },
  { src: "/bts-4.jpg", tag: "Behind the Scenes" },
  { src: "/bts-3.jpg", tag: "Behind the Scenes" },
];

// Each grid photo is drawn as a three.js plane synced to its DOM cell: it
// bows and pixel-smears with scroll velocity, splits into RGB on a hard
// scroll, and pushes toward the cursor on hover. The DOM grid stays put
// underneath for layout, alt text, lazy-loading and the no-WebGL /
// reduced-motion fallback.
export default function Gallery() {
  const sectionRef = useRef(null);
  const mountRef = useRef(null);
  const itemRefs = useRef([]);
  const [glReady, setGlReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    const section = sectionRef.current;
    if (!mount || !section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!hasWebGL()) return;

    // Fresh canvas per mount — reusing a JSX <canvas> breaks under React
    // StrictMode's double-invoke (the element keeps its first, now-disposed
    // GL context).
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
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height, false);
      fitPixelCamera(camera, width, height);
    };
    resize();

    const geometry = new THREE.PlaneGeometry(1, 1, 18, 18);
    const loader = new THREE.TextureLoader();
    let loadedCount = 0;

    const planes = PHOTOS.map((photo) => {
      const material = makeImagePlaneMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);

      loadPlaneTexture(loader, photo.src, (tex) => {
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
        loadedCount += 1;
        if (loadedCount >= PHOTOS.length) setGlReady(true);
      });

      return { mesh, material };
    });

    // Never leave the DOM grid showing through forever if a texture stalls.
    const readyFallback = setTimeout(() => alive && setGlReady(true), 2000);

    // Hover state comes from the DOM cells (the canvas is pointer-events:none).
    let hoverIndex = -1;
    const hoverUv = new THREE.Vector2(0.5, 0.5);
    const cellCleanups = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        hoverIndex = i;
        hoverUv.set(
          (e.clientX - r.left) / r.width,
          1 - (e.clientY - r.top) / r.height
        );
      };
      const onLeave = () => {
        if (hoverIndex === i) hoverIndex = -1;
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerenter", onMove);
      el.addEventListener("pointerleave", onLeave);
      cellCleanups.push(() => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerenter", onMove);
        el.removeEventListener("pointerleave", onLeave);
      });
    });

    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    const onScroll = () => {
      const y = window.scrollY;
      scrollVel += y - lastScrollY;
      lastScrollY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    let onScreen = false;
    let frameId = null;
    const clock = new THREE.Clock();

    const syncPlane = (mesh, material, el) => {
      const r = el.getBoundingClientRect();
      mesh.scale.set(r.width, r.height, 1);
      mesh.position.x = r.left + r.width / 2 - width / 2;
      mesh.position.y = -(r.top + r.height / 2 - height / 2);
      material.uniforms.uPlaneRes.value.set(r.width, r.height);
      return r;
    };

    const render = () => {
      frameId = requestAnimationFrame(render);
      const t = clock.getElapsedTime();
      scrollVel *= 0.82;
      const vel = THREE.MathUtils.clamp(scrollVel * 0.008, -1.2, 1.2);

      planes.forEach(({ mesh, material }, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const r = syncPlane(mesh, material, el);
        const visible =
          !!mesh.userData.loaded && r.bottom > -200 && r.top < height + 200;
        mesh.visible = visible;
        if (!visible) return;

        const u = material.uniforms;
        u.uTime.value = t;
        u.uVelocity.value += (vel - u.uVelocity.value) * 0.25;
        u.uHover.value += ((hoverIndex === i ? 1 : 0) - u.uHover.value) * 0.12;
        if (hoverIndex === i) u.uHoverUv.value.lerp(hoverUv, 0.15);
        u.uAlpha.value += (1 - u.uAlpha.value) * 0.08;
      });

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
      { rootMargin: "300px 0px" }
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
      cellCleanups.forEach((fn) => fn());
      planes.forEach(({ mesh, material }) => {
        scene.remove(mesh);
        material.uniforms.uTexture.value?.dispose();
        material.dispose();
      });
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="flex min-h-screen w-full snap-start flex-col justify-center bg-void-950 px-6 py-28"
    >
      <div
        ref={mountRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${
          glReady ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="mx-auto w-full max-w-5xl">
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
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className={`group relative aspect-video overflow-hidden rounded-sm ${
                i === 0
                  ? "col-span-2 sm:col-span-2 sm:row-span-2 aspect-square sm:aspect-auto"
                  : ""
              }`}
            >
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className={`object-cover transition-opacity duration-500 group-hover:scale-105 ${
                  glReady ? "opacity-0" : "opacity-100"
                }`}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void-950/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <span className="pointer-events-none absolute bottom-2 left-2 z-[21] rounded-full bg-void-950/70 px-2.5 py-1 text-[10px] uppercase tracking-wide text-bone-300 opacity-0 backdrop-blur transition group-hover:opacity-100">
                {photo.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
