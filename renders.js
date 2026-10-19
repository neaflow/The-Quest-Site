/* ==========================================================================
   renders.js
   The Quest scene renderer.

   Every drawing is now a pre-made PNG in /media. Each page is composed by
   placing those PNGs in order, back to front. Nothing is drawn with vector
   logic any more; this file only positions images.

   Asset conventions:
     - Character sheets are 1400x1500, feet at (700,1400), drawn at a
       canonical height of 1000. A body sheet and a head sheet share the
       same canvas, so drawing body then head rebuilds the character.
     - House sheets are 1200x1400, with the wall's top-left at (100,600)
       and the wall itself 1000x800.
     - Backgrounds, paths and speech bubbles are 2000x1600 full-scene sheets.
     - Labels keep their natural size and are scaled by the scene height.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Asset loading
   -------------------------------------------------------------------------- */

const MEDIA_DIR = "media/";
const MEDIA_VERSION = "2";

const ASSET_NAMES = [
  "bg-1", "bg-2", "bg-3", "bg-4", "bg-5", "bg-6", "bg-7",
  "path-1", "path-7",
  "house-villa-chimney", "house-villa-roof", "house-villa-wall", "house-villa-door",
  "house-charlottenburg-chimney", "house-charlottenburg-roof",
  "house-charlottenburg-wall", "house-charlottenburg-door",
  "house-window",
  "head-mr-worried-open", "head-mr-worried-flat",
  "head-mrs-worried-open", "head-mrs-angry", "head-mrs-smile",
  "head-clovis-smile", "head-gilpet-smile", "head-gilpet-lean-smile",
  "head-nurse-worried-open",
  "head-baby-smile", "head-baby-open",
  "body-mr-shrug", "body-mr-up", "body-mr-crossed",
  "body-mrs-up", "body-mrs-hips", "body-mrs-clasp", "body-mrs-none",
  "body-clovis-crossed", "body-gilpet-clasp", "body-gilpet-reach",
  "body-nurse-run",
  "body-baby-sit-play", "body-baby-sit-up", "body-baby-ride-up",
  "body-baby-held-up", "body-baby-held-none",
  "arms-cradle", "garden-roller", "pop-burst", "fence-7", "dust-puff",
  "buttercup",
  "label-mr-momeby", "label-mrs-momeby", "label-clovis", "label-miss-gilpet",
  "label-erik", "label-erik-quoted", "label-percy", "label-nursemaid",
  "bubble-1", "bubble-2", "bubble-3", "bubble-4", "bubble-5", "bubble-6",
  "bubble-7",
];

const IMAGES = {};
let assetsLoaded = false;

if (typeof window !== "undefined" && typeof Image !== "undefined") {
  window.questAssetsReady = Promise.all(
    ASSET_NAMES.map(
      (name) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            IMAGES[name] = img;
            resolve();
          };
          img.onerror = () => {
            console.error("Missing quest asset:", name);
            resolve();
          };
          img.src = MEDIA_DIR + name + ".png?v=" + MEDIA_VERSION;
        })
    )
  ).then(() => {
    assetsLoaded = true;
  });
}

/* --------------------------------------------------------------------------
   2. Placement helpers
   -------------------------------------------------------------------------- */

const CHAR_SHEET_W = 1400;
const CHAR_SHEET_H = 1700;
const CHAR_FEET_X = 700;
const CHAR_FEET_Y = 1400;
const CHAR_CANON_H = 1000;

const HOUSE_SHEET_W = 1200;
const HOUSE_SHEET_H = 1400;
const HOUSE_OFF_X = 100;
const HOUSE_OFF_Y = 600;
const HOUSE_CANON_W = 1000;
const HOUSE_CANON_H = 800;

const ROLLER_SHEET_W = 1600;
const ROLLER_SHEET_H = 1000;
const ROLLER_OFF_X = 200;
const ROLLER_OFF_Y = 400;
const ROLLER_CANON_W = 1000;
const ROLLER_CANON_H = 500;

const POP_SHEET_W = 2000;
const POP_SHEET_H = 1000;
const POP_OFF_X = 500;
const POP_OFF_Y = 400;
const POP_CANON_W = 1000;
const POP_CANON_H = 500;

const FENCE_SHEET_W = 1400;
const FENCE_SHEET_H = 500;
const FENCE_OFF_X = 100;
const FENCE_OFF_Y = 100;
const FENCE_CANON_W = 1000;
const FENCE_CANON_H = 300;

let sceneW = 0;
let sceneH = 0;
let sceneCtx = null;

let recording = false;
let pendingDraws = [];

function drawImagePart(part) {
  const img = IMAGES[part[0]];
  if (img && sceneCtx) sceneCtx.drawImage(img, part[1], part[2], part[3], part[4]);
}

function put(name, x, y, w, h) {
  const img = IMAGES[name];
  if (!img) return;
  if (recording) {
    pendingDraws.push({ parts: [[name, x, y, w, h]] });
    return;
  }
  if (sceneCtx) sceneCtx.drawImage(img, x, y, w, h);
}

function putGroup(parts) {
  if (recording) {
    pendingDraws.push({ parts });
    return;
  }
  parts.forEach(drawImagePart);
}

function putFull(name) {
  put(name, 0, 0, sceneW, sceneH);
}

function putCharacter(x, y, h, body, head) {
  const s = h / CHAR_CANON_H;
  const dx = x - CHAR_FEET_X * s;
  const dy = y - CHAR_FEET_Y * s;
  const w = CHAR_SHEET_W * s;
  const dh = CHAR_SHEET_H * s;
  putGroup([
    [body, dx, dy, w, dh],
    [head, dx, dy, w, dh],
  ]);
}

function putCradle(x, y, h) {
  const s = h / CHAR_CANON_H;
  put("arms-cradle", x - CHAR_FEET_X * s, y - CHAR_FEET_Y * s, CHAR_SHEET_W * s, CHAR_SHEET_H * s);
}

function putHouse(style, x, y, w, h) {
  const sx = w / HOUSE_CANON_W;
  const sy = h / HOUSE_CANON_H;
  const dx = x - HOUSE_OFF_X * sx;
  const dy = y - HOUSE_OFF_Y * sy;
  const dw = HOUSE_SHEET_W * sx;
  const dh = HOUSE_SHEET_H * sy;
  const parts = [
    ["house-" + style + "-chimney", dx, dy, dw, dh],
    ["house-" + style + "-roof", dx, dy, dw, dh],
    ["house-" + style + "-wall", dx, dy, dw, dh],
    ["house-" + style + "-door", dx, dy, dw, dh],
  ];

  const winW = 150;
  const winH = 184;
  const winPad = 20;
  [
    [x + w * 0.13, y + h * 0.22],
    [x + w * 0.70, y + h * 0.22],
  ].forEach(([wx, wy]) => {
    parts.push([
      "house-window",
      wx - winPad * sx,
      wy - winPad * sy,
      (winW + winPad * 2) * sx,
      (winH + winPad * 2) * sy,
    ]);
  });

  putGroup(parts);
}

function putRoller(rx, ry, rw, rh) {
  const sx = rw / ROLLER_CANON_W;
  const sy = rh / ROLLER_CANON_H;
  put(
    "garden-roller",
    rx - ROLLER_OFF_X * sx,
    ry - ROLLER_OFF_Y * sy,
    ROLLER_SHEET_W * sx,
    ROLLER_SHEET_H * sy
  );
}

function putPopBurst(rx, ry, rw, rh) {
  const sx = rw / POP_CANON_W;
  const sy = rh / POP_CANON_H;
  put(
    "pop-burst",
    rx - POP_OFF_X * sx,
    ry - POP_OFF_Y * sy,
    POP_SHEET_W * sx,
    POP_SHEET_H * sy
  );
}

function putFence(fx, fy, fw, fh) {
  const sx = fw / FENCE_CANON_W;
  const sy = fh / FENCE_CANON_H;
  put(
    "fence-7",
    fx - FENCE_OFF_X * sx,
    fy - FENCE_OFF_Y * sy,
    FENCE_SHEET_W * sx,
    FENCE_SHEET_H * sy
  );
}

function putDust(x, y, s) {
  const scale = s / 100;
  put("dust-puff", x - 200 * scale, y - 150 * scale, 400 * scale, 300 * scale);
}

function putButtercup(x, y, s) {
  const scale = s / 100;
  put("buttercup", x - 120 * scale, y - 290 * scale, 240 * scale, 300 * scale);
}

function putLabel(name, x, y) {
  const img = IMAGES[name];
  if (!img || !sceneCtx) return;
  const scale = sceneH / 1600;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  put(name, x - w / 2, y - h / 2, w, h);
}

/* --------------------------------------------------------------------------
   3. Pages
   -------------------------------------------------------------------------- */

const SCENES = [drawPage1, drawPage2, drawPage3, drawPage4, drawPage5, drawPage6, drawPage7];

function drawPage1() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-1");
  putHouse("villa", W * 0.58, H * 0.3, W * 0.4, H * 0.32);
  putFull("path-1");

  putCharacter(W * 0.26, H * 0.9, H * 0.5, "body-mr-shrug", "head-mr-worried-open");
  putCharacter(W * 0.43, H * 0.92, H * 0.47, "body-mrs-up", "head-mrs-worried-open");

  putLabel("label-mr-momeby", W * 0.26, H * 0.955);
  putLabel("label-mrs-momeby", W * 0.43, H * 0.975);
  putFull("bubble-1");
}

function drawPage2() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-2");
  putHouse("villa", W * 0.68, H * 0.36, W * 0.3, H * 0.27);

  putCharacter(W * 0.7, H * 0.9, H * 0.5, "body-clovis-crossed", "head-clovis-smile");
  putCharacter(W * 0.3, H * 0.92, H * 0.47, "body-mrs-hips", "head-mrs-angry");
  putCharacter(W * 0.48, H * 0.84, H * 0.38, "body-mr-shrug", "head-mr-worried-flat");

  putLabel("label-clovis", W * 0.7, H * 0.955);
  putLabel("label-mrs-momeby", W * 0.3, H * 0.975);
  putLabel("label-mr-momeby", W * 0.48, H * 0.9);
  putFull("bubble-2");
}

function drawPage3() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-3");

  putCharacter(W * 0.35, H * 0.9, H * 0.55, "body-gilpet-clasp", "head-gilpet-smile");
  putCharacter(W * 0.62, H * 0.92, H * 0.47, "body-mrs-clasp", "head-mrs-smile");
  putCharacter(W * 0.79, H * 0.93, H * 0.49, "body-mr-crossed", "head-mr-worried-flat");

  putLabel("label-miss-gilpet", W * 0.35, H * 0.955);
  putLabel("label-mrs-momeby", W * 0.6, H * 0.97);
  putLabel("label-mr-momeby", W * 0.81, H * 0.978);
  putFull("bubble-3");
}

function drawPage4() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-4");

  putCharacter(W * 0.31, H * 0.9, H * 0.52, "body-gilpet-reach", "head-gilpet-lean-smile");
  putCharacter(W * 0.6, H * 0.91, H * 0.24, "body-baby-sit-play", "head-baby-smile");

  putDust(W * 0.53, H * 0.89, H * 0.035);
  putDust(W * 0.67, H * 0.9, H * 0.03);
  putDust(W * 0.57, H * 0.95, H * 0.025);

  putButtercup(W * 0.5, H * 0.94, H * 0.03);
  putButtercup(W * 0.54, H * 0.97, H * 0.024);
  putButtercup(W * 0.66, H * 0.95, H * 0.028);
  putButtercup(W * 0.7, H * 0.9, H * 0.025);

  putLabel("label-miss-gilpet", W * 0.31, H * 0.955);
  putLabel("label-erik-quoted", W * 0.6, H * 0.96);
  putFull("bubble-4");
}

function drawPage5() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-5");
  putHouse("villa", W * 0.82, H * 0.32, W * 0.26, H * 0.26);

  const rx = W * 0.48;
  const ry = H * 0.62;
  const rw = W * 0.32;
  const rh = H * 0.17;

  putRoller(rx, ry, rw, rh);
  putPopBurst(rx, ry, rw, rh);

  const popX = rx + rh * 0.06;
  putCharacter(popX, ry + rh * 0.65, H * 0.21, "body-baby-held-up", "head-baby-smile");
  putCharacter(rx + rw * 0.57, ry, H * 0.2, "body-baby-ride-up", "head-baby-open");

  putCharacter(W * 0.15, H * 0.92, H * 0.46, "body-mr-up", "head-mr-worried-open");
  putCharacter(W * 0.32, H * 0.94, H * 0.44, "body-mrs-up", "head-mrs-worried-open");

  putLabel("label-mr-momeby", W * 0.15, H * 0.95);
  putLabel("label-mrs-momeby", W * 0.32, H * 0.982);
  putLabel("label-erik", popX, H * 0.855);
  putLabel("label-percy", rx + rw * 0.57, H * 0.855);
  putFull("bubble-5");
}

function drawPage6() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-6");
  putHouse("villa", W * 0.72, H * 0.35, W * 0.28, H * 0.28);

  const mrsX = W * 0.37;
  const mrsY = H * 0.92;
  const mrsH = H * 0.5;
  putCharacter(mrsX, mrsY, mrsH, "body-mrs-none", "head-mrs-smile");
  putLabel("label-mrs-momeby", W * 0.37, H * 0.975);

  const erikX = mrsX + mrsH * 0.03 + W * 0.005;
  const erikY = H * 0.78;
  const erikH = H * 0.18;
  putCharacter(erikX, erikY, erikH, "body-baby-held-none", "head-baby-smile");
  putCradle(mrsX, mrsY, mrsH);
  putLabel("label-erik", erikX + W * 0.065, erikY - erikH * 0.76 + H * 0.005);

  putCharacter(W * 0.63, H * 0.93, H * 0.48, "body-mr-shrug", "head-mr-worried-open");
  putLabel("label-mr-momeby", W * 0.63, H * 0.978);

  putCharacter(W * 0.78, H * 0.92, H * 0.24, "body-baby-sit-up", "head-baby-open");
  putLabel("label-percy", W * 0.78, H * 0.975);
  putFull("bubble-6");
}

function drawPage7() {
  const W = sceneW;
  const H = sceneH;

  putFull("bg-7");
  putHouse("charlottenburg", W * 0.62, H * 0.28, W * 0.26, H * 0.3);
  putFull("path-7");
  putFence(W * 0.52, H * 0.63, W * 0.48, H * 0.12);

  const mrsX = W * 0.17;
  const mrsY = H * 0.93;
  const mrsH = H * 0.47;
  putCharacter(mrsX, mrsY, mrsH, "body-mrs-none", "head-mrs-smile");
  putLabel("label-mrs-momeby", W * 0.17, H * 0.975);

  const erikX = mrsX + mrsH * 0.03 + W * 0.005;
  const erikY = H * 0.8;
  const erikH = H * 0.17;
  putCharacter(erikX, erikY, erikH, "body-baby-held-none", "head-baby-smile");
  putCradle(mrsX, mrsY, mrsH);
  putLabel("label-erik", erikX + W * 0.055, erikY - erikH * 0.76 + H * 0.005);

  putCharacter(W * 0.45, H * 0.92, H * 0.24, "body-baby-sit-up", "head-baby-open");
  putLabel("label-percy", W * 0.45, H * 0.975);

  putCharacter(W * 0.85, H * 0.92, H * 0.5, "body-nurse-run", "head-nurse-worried-open");
  putLabel("label-nursemaid", W * 0.85, H * 0.975);
  putFull("bubble-7");
}

/* --------------------------------------------------------------------------
   4. Entry point
   -------------------------------------------------------------------------- */

const REVEAL_MS = 1000;
const RISE_FRACTION = 0.035;
let rafId = null;
let animationToken = 0;

function stopAnimation() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  animationToken += 1;
}

function drawEntry(entry, alpha = 1, dy = 0) {
  if (!sceneCtx) return;
  sceneCtx.globalAlpha = alpha;
  entry.parts.forEach((part) => {
    const img = IMAGES[part[0]];
    if (img) sceneCtx.drawImage(img, part[1], part[2] + dy, part[3], part[4]);
  });
  sceneCtx.globalAlpha = 1;
}

function drawQuestScene(ctx, width, height, pageIndex, animate = true) {
  if (!assetsLoaded) return false;

  stopAnimation();
  sceneCtx = ctx;
  sceneW = width;
  sceneH = height;

  /* Record the page's sprites in draw order instead of painting them. */
  recording = true;
  pendingDraws = [];
  const draw = SCENES[pageIndex] || SCENES[0];
  draw();
  recording = false;
  const entries = pendingDraws;
  pendingDraws = [];

  /* The scene background is static: draw it immediately, then animate
     everything else in layer order on top of it. */
  const staticEntries =
    entries.length > 0 && entries[0].parts.every((part) => part[0].startsWith("bg-"))
      ? [entries[0]]
      : [];
  const animatedEntries = staticEntries.length > 0 ? entries.slice(1) : entries;

  const drawStatic = () => staticEntries.forEach((entry) => drawEntry(entry, 1, 0));

  ctx.clearRect(0, 0, width, height);
  drawStatic();

  if (!animate || animatedEntries.length === 0 || typeof requestAnimationFrame !== "function") {
    animatedEntries.forEach((entry) => drawEntry(entry, 1, 0));
    return true;
  }

  /* Each sprite fades in and rises into place, one starting after the
     other, with the whole sequence finishing in REVEAL_MS. */
  const token = animationToken;
  const count = animatedEntries.length;
  const perSprite =
    count <= 1 ? REVEAL_MS : Math.min(300, Math.max(160, (REVEAL_MS / count) * 2.5));
  const spacing = count <= 1 ? 0 : (REVEAL_MS - perSprite) / (count - 1);
  const rise = height * RISE_FRACTION;
  const start = performance.now();

  const drawFrame = (elapsed) => {
    ctx.clearRect(0, 0, width, height);
    drawStatic();
    for (let i = 0; i < count; i += 1) {
      const progress = (elapsed - i * spacing) / perSprite;
      if (progress <= 0) continue;
      const eased = progress >= 1 ? 1 : 1 - Math.pow(1 - progress, 3);
      drawEntry(animatedEntries[i], eased, (1 - eased) * rise);
    }
  };

  const frame = (now) => {
    if (token !== animationToken) return;
    const elapsed = now - start;
    if (elapsed >= REVEAL_MS) {
      drawFrame(REVEAL_MS);
      rafId = null;
      return;
    }
    drawFrame(elapsed);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return true;
}
