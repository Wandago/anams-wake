"use client";

import * as THREE from "three";

// Shared pieces for the scroll-reactive image planes used by the Hero
// backdrop, the Poster, and the Gallery. Each of those owns its own
// <canvas> / renderer / RAF loop; this module just holds the parts that
// would otherwise be copy-pasted three times.

export const imagePlaneVertexShader = /* glsl */ `
  uniform float uVelocity;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uHoverUv;
  uniform float uBow;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(uv.x * 3.14159265) * sin(uv.y * 3.14159265);
    pos.z += wave * uVelocity * 26.0 * uBow;
    pos.z += sin(uTime * 0.7 + uv.y * 5.0) * 1.4 * uBow;
    float d = distance(uv, uHoverUv);
    pos.z += uHover * smoothstep(0.55, 0.0, d) * 32.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const imagePlaneFragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uImageRes;
  uniform vec2 uPlaneRes;
  uniform float uVelocity;
  uniform float uHover;
  uniform vec2 uHoverUv;
  uniform float uAlpha;
  uniform float uVignette; // 0 = none, 1 = full filmic vignette
  uniform float uTint;     // extra flat darken, 0..1 (Hero backdrop)
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

    // drag pixels along the scroll direction
    uv.y += uVelocity * 0.07 * (1.0 - abs(vUv.x - 0.5));

    // chromatic split on fast scroll (and a touch on hover)
    float ca = abs(uVelocity) * 0.03 + uHover * 0.006;
    float r = texture2D(uTexture, uv + vec2(ca, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(ca, 0.0)).b;
    vec3 col = vec3(r, g, b);

    float vig = smoothstep(1.15, 0.35, distance(vUv, vec2(0.5)));
    col *= mix(1.0, mix(0.72, 1.0, vig), uVignette);
    col += uHover * smoothstep(0.6, 0.0, distance(vUv, uHoverUv)) * 0.10;
    col *= (1.0 - uTint);

    gl_FragColor = vec4(col, uAlpha);
  }
`;

export function makeImagePlaneUniforms(overrides = {}) {
  const u = {
    uTexture: { value: null },
    uImageRes: { value: new THREE.Vector2(1, 1) },
    uPlaneRes: { value: new THREE.Vector2(1, 1) },
    uVelocity: { value: 0 },
    uTime: { value: 0 },
    uHover: { value: 0 },
    uHoverUv: { value: new THREE.Vector2(0.5, 0.5) },
    uAlpha: { value: 0 },
    uVignette: { value: 1 },
    uBow: { value: 1 },
    uTint: { value: 0 },
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

// A perspective camera whose projection maps 1 world unit to 1 CSS pixel
// at z = 0, so meshes can be sized/positioned directly from getBoundingClientRect().
export function fitPixelCamera(camera, width, height, perspective = 1000) {
  camera.fov = (180 * (2 * Math.atan(height / 2 / perspective))) / Math.PI;
  camera.aspect = width / height;
  camera.position.z = perspective;
  camera.near = 1;
  camera.far = perspective * 3;
  camera.updateProjectionMatrix();
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
