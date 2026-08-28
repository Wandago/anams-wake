"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import * as THREE from "three";

const PHOTOS = [
  { src: "/still-3.jpg", tag: "Still" },
  { src: "/still-5.jpg", tag: "Still" },
  { src: "/bts-1.jpg", tag: "Behind the Scenes" },
  { src: "/bts-5.jpg", tag: "Behind the Scenes" },
  { src: "/bts-2.jpg", tag: "Behind the Scenes" },
  { src: "/bts-4.jpg", tag: "Behind the Scenes" },
  { src: "/bts-3.jpg", tag: "Behind the Scenes" },
];

// Each grid photo is drawn as a three.js plane synced to its DOM cell.
// The plane bows and smears with scroll velocity, splits into RGB on a
// hard scroll, and pushes toward the viewer under the cursor. The DOM
// grid stays put underneath for layout, alt text, lazy-loading and the
// no-WebGL / reduced-motion fallback.
const vertexShader = /* glsl */ `
  uniform float uVelocity;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uHoverUv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265);
    pos.z += wave * uVelocity * 26.0;
    pos.z += sin(uTime * 0.7 + uv.y * 5.0) * 1.4;
    float d = distance(uv, uHoverUv);
    pos.z += uHover * smoothstep(0.55, 0.0, d) * 32.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uImageRes;
  uniform vec2 uPlaneRes;
  uniform float uVelocity;
  uniform float uHover;
  uniform vec2 uHoverUv;
  uniform float uAlpha;
  varying vec2 vUv;

  void main() {
    // object-fit: cover
    vec2 ratio = vec2(
      min((uPlaneRes.x / uPlaneRes.y) / (uImageRes.x / uImageRes.y), 1.0),
      min((uPlaneRes.y / uPlaneRes.x) / (uImageRes.y / uImageRes.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // zoom slightly toward the cursor on hover
    uv = mix(uv, uHoverUv + (uv - uHoverUv) * 0.86, uHover);

    // drag the pixels along the scroll direction
    uv.y += uVelocity * 0.07 * (1.0 - abs(vUv.x - 0.5));

    // chromatic split on fast scroll (and a touch on hover)
    float ca = abs(uVelocity) * 0.03 + uHover * 0.006;
    float r = texture2D(uTexture, uv + vec2(ca, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(ca, 0.0)).b;
    vec3 col = vec3(r, g, b);

    // vignette + hover lift
    float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
    col *= mix(0.72, 1.0, vig);
    col += uHover * smoothstep(0.6, 0.0, distance(vUv, uHoverUv)) * 0.10;

    gl_FragColor = vec4(col, uAlpha);
  }
`;

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
    const dprCap = width < 640 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const perspective = 1000;
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    camera.position.set(0, 0, perspective);

    const setCamera = () => {
      camera.fov = (180 * (2 * Math.atan(height / 2 / perspective))) / Math.PI;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height, false);
      setCamera();
    };
    resize();

    const geometry = new THREE.PlaneGeometry(1, 1, 28, 28);
    const loader = new THREE.TextureLoader();
    let loadedCount = 0;

    const planes = PHOTOS.map((photo) => {
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTexture: { value: null },
          uImageRes: { value: new THREE.Vector2(1, 1) },
          uPlaneRes: { value: new THREE.Vector2(1, 1) },
          uVelocity: { value: 0 },
          uTime: { value: 0 },
          uHover: { value: 0 },
          uHoverUv: { value: new THREE.Vector2(0.5, 0.5) },
          uAlpha: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);

      loader.load(photo.src, (tex) => {
        if (!alive) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
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
