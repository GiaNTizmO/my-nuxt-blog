import * as THREE from './vendor/three.module.js';

// Full-page background: an animated topographic map.
// A fragment shader builds a height field from layered noise and draws
// contour lines through it. The terrain drifts slowly, shifts with scrolling
// and bulges under the pointer. Rendered on one fixed quad behind the page.

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uRes;
  uniform vec2  uMouse;      // in pixels, y from bottom
  uniform float uMouseOn;    // 0..1, fades the bump in/out
  uniform vec3  uLine;
  uniform vec3  uAccent;
  uniform float uOpacity;

  // Classic 2D value noise + fbm, good enough for smooth terrain.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
  }

  void main() {
    // Work in pixel-based coordinates so contours keep their size on any screen.
    vec2 px = vUv * uRes;
    vec2 p = px / 520.0;
    p.y -= uScroll / 520.0 * 0.35;          // parallax: terrain scrolls slower than content

    // Domain warping makes the contours flow instead of just sliding.
    float t = uTime * 0.025;
    vec2 warp = vec2(fbm(p + vec2(t, 0.0)), fbm(p + vec2(0.0, -t) + 5.2));
    float h = fbm(p + warp * 1.4 + t * 0.6);

    // Pointer: a soft hill that the contour lines wrap around.
    float d = length(px - uMouse) / 260.0;
    h += uMouseOn * 0.16 * exp(-d * d * 2.5);

    // Contour lines: distance to the nearest level, antialiased with fwidth.
    float levels = 22.0;
    float v = h * levels;
    float w = fwidth(v);
    float line = 1.0 - smoothstep(0.0, w * 1.2, abs(fract(v - 0.5) - 0.5));
    // Every 5th line is an "index contour": slightly bolder and in accent colour.
    float major = 1.0 - smoothstep(0.0, w * 2.0, abs(fract(v / 5.0 - 0.5) - 0.5) * 5.0);

    vec3 col = mix(uLine, uAccent, major);
    float a = max(line * 0.55, major * 0.9) * uOpacity;
    gl_FragColor = vec4(col * a, a);         // premultiplied alpha
  }
`;

const themeColors = dark => dark
  ? { line: new THREE.Color(0x3d4d42), accent: new THREE.Color(0x6f8f68), opacity: 0.6 }
  : { line: new THREE.Color(0xd3dacb), accent: new THREE.Color(0xa9b99f), opacity: 0.55 };

export function createBackground(toggleButton) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' }); }
  catch { return () => {}; }

  // A lower pixel ratio keeps the shader cheap; lines stay crisp thanks to fwidth.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const isDark = () => document.documentElement.dataset.theme === 'dark';
  const c = themeColors(isDark());
  const uniforms = {
    uTime: { value: Math.random() * 1000 },
    uScroll: { value: scrollY },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
    uMouseOn: { value: 0 },
    uLine: { value: c.line },
    uAccent: { value: c.accent },
    uOpacity: { value: c.opacity },
  };
  // Dim factor: 1 on regular pages, lower on article pages so long text stays readable.
  let baseOpacity = c.opacity, dim = 1, dimTarget = 1;
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthTest: false, premultipliedAlpha: true });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();

  const draw = () => renderer.render(scene, camera);
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    uniforms.uRes.value.set(innerWidth, innerHeight);
    draw();
  };
  addEventListener('resize', resize);
  resize();

  // Pointer target is smoothed in the loop so the hill glides after the cursor.
  const target = new THREE.Vector2(-9999, -9999);
  let mouseInside = false;
  const onMove = e => {
    target.set(e.clientX, innerHeight - e.clientY);
    if (!mouseInside) { uniforms.uMouse.value.copy(target); mouseInside = true; }
  };
  const onLeave = () => { mouseInside = false; };
  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  const onScroll = () => { if (paused) { uniforms.uScroll.value = scrollY; draw(); } };
  addEventListener('scroll', onScroll, { passive: true });

  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = () => {
    if (!toggleButton) return;
    toggleButton.textContent = paused ? toggleButton.dataset.play : toggleButton.dataset.pause;
    toggleButton.setAttribute('aria-pressed', String(paused));
  };
  const toggle = () => { paused = !paused; label(); };
  toggleButton?.addEventListener('click', toggle);
  label();

  let frame = 0, last = performance.now();
  const tick = now => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!paused && !document.hidden) {
      uniforms.uTime.value += dt;
      uniforms.uScroll.value += (scrollY - uniforms.uScroll.value) * 0.12;
      uniforms.uMouse.value.lerp(target, 0.08);
      dim += (dimTarget - dim) * 0.06;
      uniforms.uOpacity.value = baseOpacity * dim;
      uniforms.uMouseOn.value += ((mouseInside ? 1 : 0) - uniforms.uMouseOn.value) * 0.05;
      draw();
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  const onTheme = () => {
    const t = themeColors(isDark());
    uniforms.uLine.value = t.line; uniforms.uAccent.value = t.accent; baseOpacity = t.opacity; uniforms.uOpacity.value = baseOpacity * dim;
    draw();
  };
  document.addEventListener('themechange', onTheme);

  const setDim = v => { dimTarget = v; if (paused) { dim = v; uniforms.uOpacity.value = baseOpacity * dim; draw(); } };

  return { relabel: label, setDim, dispose: () => {
    cancelAnimationFrame(frame);
    removeEventListener('resize', resize); removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll);
    document.removeEventListener('pointerleave', onLeave); document.removeEventListener('themechange', onTheme);
    toggleButton?.removeEventListener('click', toggle);
    geometry.dispose(); material.dispose(); renderer.dispose(); canvas.remove();
  } };
}
