// page flipping and navslop
const pages = [
  "Mr and Mrs. Momeby realize that their son, Erik, is missing from the lawn, where he was \"toddling about\", and they can't find Erik anywhere on the villa.",
  "Clovis, another guest at the villa, jokes about the situation and doesn't take it too seriously, which Mrs. Momeby eventually stops entertaining.",
  "Miss Gilpet hears about the situation, and suggests using \"faith\" to find Erik, to which the Momebys accept.",
  "Miss Gilpet goes out to search the road that Mrs. Momeby said she already searched, where she finds Erik playing with dust. She then brings Erik back to the villa.",
  "The baby who was found on the road, percieved to be Erik, wouldn't stop crying and howling, so they try giving him a ride on the garden roller, which the real Erik then pops out of.",
  "The Momebys are relieved to see who is undoubtedly their real son, Erik, but are confused who the other baby from the road is, if not Erik.",
  "A nursemaid ran over and identified the baby as her own that she was looking after, names little Percy, who had wandered off through the front gate."
];

let current = 0;
let drawnOnce = false;

const textEl = document.getElementById("page-text");
const prevBtn = document.getElementById("prev-button");
const nextBtn = document.getElementById("next-button");
const counterEl = document.getElementById("page-counter");
const stageEl = document.querySelector(".stage");
const canvasEl = document.getElementById("scene-canvas");
const ctx = canvasEl.getContext("2d");

function drawScene(animate = true) {
  const rect = stageEl.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (canvasEl.width !== Math.round(width * dpr) || canvasEl.height !== Math.round(height * dpr)) {
    canvasEl.width = Math.round(width * dpr);
    canvasEl.height = Math.round(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const drawn = drawQuestScene(ctx, width, height, current, animate);
  if (drawn) drawnOnce = true;
}

function render() {
  textEl.textContent = pages[current];
  counterEl.textContent = (current + 1) + "/" + pages.length;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === pages.length - 1;
  drawScene();
}

prevBtn.addEventListener("click", () => {
  if (current > 0) {
    current -= 1;
    render();
  }
});

nextBtn.addEventListener("click", () => {
  if (current < pages.length - 1) {
    current += 1;
    render();
  }
});

render();

if ("ResizeObserver" in window) {
  new ResizeObserver(() => {
    if (drawnOnce) drawScene(false);
  }).observe(stageEl);
} else {
  window.addEventListener("resize", () => {
    if (drawnOnce) drawScene(false);
  });
}

if (window.questAssetsReady) {
  window.questAssetsReady.then(() => {
    if (!drawnOnce) drawScene(true);
  });
}
