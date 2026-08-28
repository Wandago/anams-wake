"use client";

import * as THREE from "three";

// Shared pieces for the image planes behind the Hero, the Poster, and the
// Gallery. The feel: not a glitch, a passage. Planes drift slowly like
// they're suspended in still water, their edges dissolve into the dark,
// and colour drains cooler the further you scroll — as if the whole site
// is sinking toward the land of the dead. Nothing reacts to raw scroll
// velocity; everything is eased.

export const imagePlaneVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDepth;   // 0 = the world of the living, 1 = fully crossed over
  uniform float uIdle;    // amount of weightless undulation
  uniform float uHover;
  uniform vec2 uHoverUv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // slow, weightless undulation — drifting, not vibrating
    float drift =
      sin(uTime * 0.18 + uv.y * 2.2) * 0.5 +
      sin(uTime * 0.11 + uv.x * 1.7) * 0.5;
    pos.z += drift * 3.0 * uIdle;

    // as we sink deeper the plane is drawn gently inward and back,
    // like being pulled through a threshold
    pos.xy -= (uv - 0.5) * uDepth * 0.04;
    pos.z -= uDepth * 90.0;

    // soft lift toward the cursor
    float d = distance(uv, uHoverUv);
    pos.z += uHover * smoothstep(0.6, 0.0, d) * 12.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const imagePlaneFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uImageRes;
  uniform vec2 uPlaneRes;
  uniform float uAlpha;
  uniform float uTime;
  uniform float uDepth;
  uniform float uHover;
  uniform vec2 uHoverUv;
  uniform float uFeather;   // width of the edge dissolve
  uniform float uEdgeMelt;  // 0 = keep a hard edge, 1 = melt into black
  uniform float uVignette;
  uniform float uColdness;   // how much uDepth drains the colour
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

    // barely-there heat-haze so the still image never feels frozen
    uv += vec2(
      sin(uTime * 0.12 + vUv.y * 3.0),
      cos(uTime * 0.10 + vUv.x * 3.0)
    ) * 0.0016;

    // gentle zoom toward the cursor
    uv = mix(uv, uHoverUv + (uv - uHoverUv) * 0.92, uHover * 0.6);

    vec3 col = texture2D(uTexture, uv).rgb;

    // cool and part-drain the colour as we cross over (keeps luminance)
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 cold = mix(vec3(luma), col, 0.45) * vec3(0.93, 0.97, 1.06);
    col = mix(col, cold, clamp(uDepth, 0.0, 1.0) * uColdness);

    // slow breathing vignette
    float vig = smoothstep(1.2, 0.32, distance(vUv, vec2(0.5)));
    float breath = 0.94 + 0.06 * sin(uTime * 0.3);
    col *= mix(1.0, mix(0.6, 1.0, vig) * breath, uVignette);

    col += uHover * smoothstep(0.55, 0.0, distance(vUv, uHoverUv)) * 0.06;

    // dissolve the edges into the dark
    float f = max(uFeather, 0.001);
    float fx = smoothstep(0.0, f, vUv.x) * smoothstep(1.0, 1.0 - f, vUv.x);
    float fy = smoothstep(0.0, f, vUv.y) * smoothstep(1.0, 1.0 - f, vUv.y);
    float edge = mix(1.0, fx * fy, uEdgeMelt);

    gl_FragColor = vec4(col, uAlpha * edge);
  }
`;

export function makeImagePlaneUniforms(overrides = {}) {
  const u = {
    uTexture: { value: null },
    uImageRes: { value: new THREE.Vector2(1, 1) },
    uPlaneRes: { value: new THREE.Vector2(1, 1) },
    uAlpha: { value: 0 },
    uTime: { value: 0 },
    uDepth: { value: 0 },
    uIdle: { value: 1 },
    uHover: { value: 0 },
    uHoverUv: { value: new THREE.Vector2(0.5, 0.5) },
    uFeather: { value: 0.16 },
    uEdgeMelt: { value: 1 },
    uVignette: { value: 1 },
    uColdness: { value: 1 },
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (u[k]) u[k].value = v;
  }
  return u;
}

export function makeImagePlaneMaterial(overrides) {
  return new THREE.ShaderMaterial({
    vertexShader: imagePlaneVertexShader,
    fragmentShader: imagePlaneFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: makeImagePlaneUniforms(overrides),
  });
}

// Perspective camera whose projection maps 1 world unit to 1 CSS pixel at
// z = 0, so meshes can be sized straight from getBoundingClientRect().
export function fitPixelCamera(camera, width, height, perspective = 1000) {
  camera.fov = (180 * (2 * Math.atan(height / 2 / perspective))) / Math.PI;
  camera.aspect = width / height;
  camera.position.z = perspective;
  camera.near = 1;
  camera.far = perspective * 3;
  camera.updateProjectionMatrix();
}

// Frame-rate-independent easing. lambda ~= how fast it catches up.
export function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

// 0 at the top of the page, 1 at the bottom — how far we've travelled in.
export function pageDepth() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function loadPlaneTexture(loader, src, onReady) {
  loader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    onReady(tex);
  });
}
