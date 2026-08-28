"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import * as THREE from "three";
import {
  damp,
  fitPixelCamera,
  hasWebGL,
  loadPlaneTexture,
  makeImagePlaneMaterial,
  pageDepth,
} from "./gl/imagePlane";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Scroll-scrub scale/rotation, matched to the previous framer-motion values.
const posterScale = (p) =>
  p < 0.55 ? lerp(0.72, 1.06, p / 0.55) : lerp(1.06, 1, (p - 0.55) / 0.45);
const posterTilt = (p) => (p < 0.55 ? lerp(-4, 0, p / 0.55) : 0);

export default function Poster() {
  const ref = useRef(null);
  const stickyRef = useRef(null);
  const frameRef = useRef(null);
  const mountRef = useRef(null);
  const [glReady, setGlReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 42,
    mass: 0.5,
  });
  const glowOpacity = useTransform(progress, [0, 0.5, 1], [0.35, 1, 0.7]);
  const labelOpacity = useTransform(progress, [0.55, 0.8], [0, 1]);
  const labelY = useTransform(progress, [0.55, 0.8], [12, 0]);

  // DOM-only fallback transforms (used when WebGL is off / reduced motion).
  const domScale = useTransform(progress, [0, 0.55, 1], [0.72, 1.06, 1]);
  const domRotate = useTransform(progress, [0, 0.55, 1], [-4, 0, 0]);

  useEffect(() => {
    const mount = mountRef.current;
    const section = ref.current;
    const frameEl = frameRef.current;
    if (!mount || !section || !frameEl) return;

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

    const geometry = new THREE.PlaneGeometry(1, 1, 24, 28);
    const material = makeImagePlaneMaterial({
      uVignette: 0.45,
      uColdness: 0.32,
      uFeather: 0.04,
      uEdgeMelt: 0,
      uIdle: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);

    const loader = new THREE.TextureLoader();
    loadPlaneTexture(loader, "/poster.jpg", (tex) => {
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

    // pointer parallax
    const pointer = new THREE.Vector2(0, 0);
    const pointerTarget = new THREE.Vector2(0, 0);
    const onPointerMove = (e) => {
      const r = (stickyRef.current || section).getBoundingClientRect();
      pointerTarget.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        ((e.clientY - r.top) / r.height) * 2 - 1
      );
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    const sticky = stickyRef.current || section;
    sticky.addEventListener("pointermove", onPointerMove);
    sticky.addEventListener("pointerleave", onPointerLeave);

    window.addEventListener("resize", resize);

    let onScreen = false;
    let frameId = null;
    let elapsed = 0;
    let depthSmooth = pageDepth();
    const clock = new THREE.Clock();

    const render = () => {
      frameId = requestAnimationFrame(render);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      depthSmooth = damp(depthSmooth, pageDepth(), 2.2, dt);
      const p = clamp01(progress.get());

      const base = frameEl.getBoundingClientRect();
      const s = posterScale(p);
      mesh.scale.set(base.width * s, base.height * s, 1);
      mesh.position.x = base.left + base.width / 2 - width / 2;
      mesh.position.y = -(base.top + base.height / 2 - height / 2);

      const pl = 1 - Math.exp(-4 * dt);
      pointer.lerp(pointerTarget, pl);
      mesh.rotation.z = (posterTilt(p) * Math.PI) / 180 + pointer.x * 0.03;
      mesh.rotation.y = pointer.x * 0.1;
      mesh.rotation.x = pointer.y * 0.07;

      const u = material.uniforms;
      u.uPlaneRes.value.set(base.width * s, base.height * s);
      u.uTime.value = elapsed;
      u.uDepth.value = depthSmooth;
      u.uAlpha.value = damp(u.uAlpha.value, mesh.userData.loaded ? 1 : 0, 3, dt);
      mesh.visible = u.uAlpha.value > 0.01;

      renderer.render(scene, camera);

      if (!onScreen) {
        cancelAnimationFrame(frameId);
        frameId = null;
        renderer.clear();
      }
    };

    const start = () => {
      if (frameId == null && alive) render();
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
      window.removeEventListener("resize", resize);
      sticky.removeEventListener("pointermove", onPointerMove);
      sticky.removeEventListener("pointerleave", onPointerLeave);
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
      id="poster"
      className="relative h-[200vh] w-full snap-start bg-void-950"
    >
      <div
        ref={mountRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${
          glReady ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={stickyRef}
        className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-24"
      >
        <motion.div
          aria-hidden="true"
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(224,180,102,0.10),transparent_65%)]"
        />
        <motion.div
          ref={frameRef}
          style={glReady ? undefined : { scale: domScale, rotate: domRotate }}
          className="relative z-10 w-full max-w-xs overflow-hidden rounded-sm border border-bone-500/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:max-w-sm"
        >
          <Image
            src="/poster.jpg"
            alt="Anam's Wake official poster"
            width={1013}
            height={1266}
            sizes="(min-width: 640px) 24rem, 20rem"
            className={`h-auto w-full transition-opacity duration-700 ${
              glReady ? "opacity-0" : "opacity-100"
            }`}
          />
        </motion.div>
        <motion.p
          style={{ opacity: labelOpacity, y: labelY }}
          className="relative z-10 mt-6 text-center text-[11px] uppercase tracking-widest2 text-bone-500"
        >
          Official Poster
        </motion.p>
      </div>
    </section>
  );
}
