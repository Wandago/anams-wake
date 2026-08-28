"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 260;

export default function EmberField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const sway = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const gold = new THREE.Color("#e0b466");
    const wax = new THREE.Color("#8a2331");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      speeds[i] = 0.15 + Math.random() * 0.35;
      sway[i] = Math.random() * Math.PI * 2;

      const c = gold.clone().lerp(wax, Math.random() * 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frameId;
    let onScreen = true;
    let t = 0;

    const animate = () => {
      if (!onScreen) {
        frameId = undefined;
        return;
      }
      if (!prefersReducedMotion) {
        t += 0.006;
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          pos[i * 3 + 1] += speeds[i] * 0.01;
          pos[i * 3] += Math.sin(t + sway[i]) * 0.0025;
          if (pos[i * 3 + 1] > 7) {
            pos[i * 3 + 1] = -7;
            pos[i * 3] = (Math.random() - 0.5) * 22;
          }
        }
        geometry.attributes.position.needsUpdate = true;
        points.rotation.y = Math.sin(t * 0.15) * 0.05;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && frameId === undefined) animate();
      },
      { rootMargin: "150px 0px" }
    );
    io.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      io.disconnect();
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
