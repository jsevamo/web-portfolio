/*
 * scene.js — Real-time WebGL hero for Juan Sebastian Vargas Molano
 * A shader-driven, GPU-displaced mesh + particle field.
 * Built with Three.js. This is the site demonstrating the craft it describes:
 * custom GLSL vertex/fragment shaders, real-time noise displacement,
 * fresnel rim lighting, and an interactive point cloud.
 */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    console.warn("[scene] Three.js failed to load — hero will show static fallback.");
    document.documentElement.classList.add("no-webgl");
    return;
  }

  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  // Respect reduced-motion preference.
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (e) {
    console.warn("[scene] WebGL context unavailable — static fallback.", e);
    document.documentElement.classList.add("no-webgl");
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // ------------------------------------------------------------------
  //  Central displaced mesh — custom GLSL with simplex-style noise.
  // ------------------------------------------------------------------
  var noiseGLSL = [
    "vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}",
    "vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}",
    "vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}",
    "vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}",
    "float snoise(vec3 v){",
    "  const vec2 C = vec2(1.0/6.0, 1.0/3.0);",
    "  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);",
    "  vec3 i  = floor(v + dot(v, C.yyy));",
    "  vec3 x0 = v - i + dot(i, C.xxx);",
    "  vec3 g = step(x0.yzx, x0.xyz);",
    "  vec3 l = 1.0 - g;",
    "  vec3 i1 = min(g.xyz, l.zxy);",
    "  vec3 i2 = max(g.xyz, l.zxy);",
    "  vec3 x1 = x0 - i1 + C.xxx;",
    "  vec3 x2 = x0 - i2 + C.yyy;",
    "  vec3 x3 = x0 - D.yyy;",
    "  i = mod289(i);",
    "  vec4 p = permute(permute(permute(",
    "     i.z + vec4(0.0, i1.z, i2.z, 1.0))",
    "   + i.y + vec4(0.0, i1.y, i2.y, 1.0))",
    "   + i.x + vec4(0.0, i1.x, i2.x, 1.0));",
    "  float n_ = 0.142857142857;",
    "  vec3 ns = n_ * D.wyz - D.xzx;",
    "  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);",
    "  vec4 x_ = floor(j * ns.z);",
    "  vec4 y_ = floor(j - 7.0 * x_);",
    "  vec4 x = x_ *ns.x + ns.yyyy;",
    "  vec4 y = y_ *ns.x + ns.yyyy;",
    "  vec4 h = 1.0 - abs(x) - abs(y);",
    "  vec4 b0 = vec4(x.xy, y.xy);",
    "  vec4 b1 = vec4(x.zw, y.zw);",
    "  vec4 s0 = floor(b0)*2.0 + 1.0;",
    "  vec4 s1 = floor(b1)*2.0 + 1.0;",
    "  vec4 sh = -step(h, vec4(0.0));",
    "  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;",
    "  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;",
    "  vec3 p0 = vec3(a0.xy, h.x);",
    "  vec3 p1 = vec3(a0.zw, h.y);",
    "  vec3 p2 = vec3(a1.xy, h.z);",
    "  vec3 p3 = vec3(a1.zw, h.w);",
    "  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));",
    "  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;",
    "  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);",
    "  m = m * m;",
    "  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));",
    "}",
  ].join("\n");

  var vertexShader = [
    "uniform float uTime;",
    "uniform float uDisplace;",
    "varying float vNoise;",
    "varying vec3 vNormal;",
    "varying vec3 vView;",
    noiseGLSL,
    "void main(){",
    "  float t = uTime * 0.25;",
    "  float n = snoise(normal * 1.6 + t);",
    "  n += 0.5 * snoise(normal * 3.2 - t * 1.3);",
    "  vNoise = n;",
    "  vec3 displaced = position + normal * n * uDisplace;",
    "  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);",
    "  vNormal = normalize(normalMatrix * normal);",
    "  vView = normalize(-mv.xyz);",
    "  gl_Position = projectionMatrix * mv;",
    "}",
  ].join("\n");

  var fragmentShader = [
    "uniform vec3 uColorA;",
    "uniform vec3 uColorB;",
    "varying float vNoise;",
    "varying vec3 vNormal;",
    "varying vec3 vView;",
    "void main(){",
    "  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);",
    "  float mixv = smoothstep(-0.6, 0.9, vNoise);",
    "  vec3 base = mix(uColorA, uColorB, mixv);",
    "  vec3 col = base + fres * 0.9;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  var uniforms = {
    uTime: { value: 0 },
    uDisplace: { value: reduceMotion ? 0.26 : 0.38 },
    uColorA: { value: new THREE.Color(0x241557) }, // deep violet
    uColorB: { value: new THREE.Color(0x43d6b6) }, // teal
  };

  var geo = new THREE.IcosahedronGeometry(1.6, 64);
  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  // Group everything so we can offset the composition to the right,
  // keeping the left side clear for the headline text.
  var group = new THREE.Group();
  scene.add(group);

  var mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Wireframe shell for extra depth.
  var wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.95, 3),
    new THREE.MeshBasicMaterial({ color: 0x6f7bff, wireframe: true, transparent: true, opacity: 0.08 })
  );
  group.add(wire);

  // ------------------------------------------------------------------
  //  Particle field.
  // ------------------------------------------------------------------
  var COUNT = 900;
  var positions = new Float32Array(COUNT * 3);
  for (var i = 0; i < COUNT; i++) {
    var r = 3.2 + Math.random() * 5.0;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  var pMat = new THREE.PointsMaterial({
    color: 0x8ea2ff,
    size: 0.026,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  var points = new THREE.Points(pGeo, pMat);
  group.add(points);

  // ------------------------------------------------------------------
  //  Interaction — pointer parallax.
  // ------------------------------------------------------------------
  var targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener("pointermove", function (e) {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ------------------------------------------------------------------
  //  Resize handling — size to the hero element.
  // ------------------------------------------------------------------
  function resize() {
    var host = canvas.parentElement || document.body;
    var w = host.clientWidth || window.innerWidth;
    var h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Composition: on wide screens push the mesh to the right half so the
    // left-aligned headline stays readable; on narrow screens center it,
    // scale it down, and let it sit softly behind the text.
    var landscape = camera.aspect >= 1;
    group.position.x = landscape ? 2.35 : 0;
    group.position.y = landscape ? 0.1 : 1.4;
    var s = landscape ? 1 : 0.72;
    group.scale.set(s, s, s);
  }
  window.addEventListener("resize", resize);
  resize();

  // ------------------------------------------------------------------
  //  Render loop — pauses when the hero scrolls out of view.
  // ------------------------------------------------------------------
  var clock = new THREE.Clock();
  var visible = true;
  var hero = document.getElementById("hero");
  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 }).observe(hero);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    var dt = clock.getDelta();
    uniforms.uTime.value += reduceMotion ? dt * 0.4 : dt;

    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;

    var spin = reduceMotion ? 0.03 : 0.09;
    mesh.rotation.y += dt * spin;
    mesh.rotation.x = curY * 0.35;
    mesh.rotation.z = curX * 0.15;
    wire.rotation.copy(mesh.rotation);
    wire.rotation.y *= 1.15;

    points.rotation.y += dt * 0.02;
    points.rotation.x = curY * 0.1;

    camera.position.x += (curX * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-curY * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();
