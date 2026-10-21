// page flipping and navslop
const pages = [
  "Mr and Mrs. Momeby realize that their son, Erik, is missing from the lawn, where he was \"toddling about\", and they can't find Erik anywhere on the villa.",
  "Clovis, another guest at the villa, jokes about the situation and doesn't take it too seriously, which Mrs. Momeby eventually stops entertaining.",
  "Miss Gilpet hears about the situation, and suggests using \"faith\" to find Erik, to which the Momebys accept.",
  "Miss Gilpet goes out to search the road that Mrs. Momeby said she already searched, where she finds Erik playing with dust. She then brings Erik back to the villa.",
  "The baby who was found on the road, percieved to be Erik, wouldn't stop crying and howling, so they try giving him a ride on the garden roller, which the real Erik then pops out of.",
  "The Momebys are relieved to see who is undoubtedly their real son, Erik, but are confused who the other baby from the road is, if not Erik.",
  "A nursemaid ran over and identified the baby as her own that she was looking after, named little Percy, who had wandered off through the front gate."
];

const pageQuotes = [
  [
    { text: `The Momebys had lost their infant child; hence the peace which its absence entailed; they were looking for it in wild, undisciplined fashion, giving tongue the whole time.`, page: 272 },
    { text: `‘We've lost Baby,’ she screamed.`, page: 272 },
    { text: `We've hunted high and low, in house and garden and outside the gates, and he's nowhere to be seen.`, page: 272 },
  ],
  [
    { text: `Do you mean that it's dead, or stampeded, or that you staked it at cards and lost it that way?`, page: 272 },
    { text: `I hope he said hollandaise, because if there's anything I hate--`, page: 272 },
    { text: `Is he anywhere to be heard? if not, he must be at least two miles away.`, page: 272 },
  ],
  [
    { text: `‘He has disappeared,’ conceded Miss Gilpet, ‘but only because you haven't sufficient faith to find him. It's only lack of faith on your part that prevents him from being restored to you safe and well.’`, page: 273 },
    { text: `‘If you have faith,’ she sobbed, struck by a happy inspiration, ‘won't you find our little Erik for us? I am sure you have powers that are denied to us.’`, page: 273 },
    { text: `Rose-Marie Gilpet was thoroughly sincere in her adherence to Christian Science principles; whether she understood or correctly expounded them the learned in such manners may best decide.`, page: 273 },
  ],
  [
    { text: `She passed out into the bare and open high road, followed by Mrs. Momeby's warning, 'It's no use going there, we've searched there a dozen times.'`, page: 273 },
    { text: `...sitting in the middle of the highway, playing contentedly with the dust and some faded buttercups, was a white-pinafored baby with a mop of tow-coloured hair tied over one temple with a pale-blue ribbon.`, page: 273 },
    { text: `Rose-Marie dashed at the child and bore it, despite its vigorous opposition, in through the portals of Elsinore.`, page: 274 },
  ],
  [
    { text: `‘Give him a ride on the roly-poly,’ suggested the father brilliantly, as the howls continued with no sign of early abatement.`, page: 274 },
    { text: `In a moment the child had been placed astride the big garden roller and a preliminary tug was given to set it in motion.`, page: 274 },
    { text: `From the hollow depths of the cylinder came an earsplitting roar, drowning even the vocal efforts of the squalling baby, and immediately afterwards there crept forth a white-pinafored infant with a mop of tow-coloured hair tied over one temple with a pale blue ribbon.`, page: 274 },
  ],
  [
    { text: `There was no mistaking either the features or the lung-power of the new arrival.`, page: 274 },
    { text: `‘If that is Erik you have in your arms, who is - that?’`, page: 274 },
    { text: `‘Obviously,’ said Clovis, ‘it's a duplicate Erik that your powers of faith called into being. The question is: What are you going to do with him?’`, page: 274 },
  ],
  [
    { text: `It was rather a relief when a breathless nursemaid from the Villa Charlottenburg over the way came running across the lawn to claim little Percy, who had slipped out of the front gate and disappeared like a twinkling from the high road.`, page: 275 },
    { text: `‘You can't take him back and leave him there,’ said Clovis; ‘the highway is meant for traffic, not to be used as a lumber-room for disused miracles.’`, page: 275 },
    { text: `And even then Clovis found it necessary to go in person to the kitchen to make sure about the asparagus sauce.`, page: 275 },
  ],
];

let current = 0;
let drawnOnce = false;

const textEl = document.getElementById("page-text");
const prevBtn = document.getElementById("prev-button");
const nextBtn = document.getElementById("next-button");
const counterEl = document.getElementById("page-counter");
const stageEl = document.querySelector(".stage");
const canvasEl = document.getElementById("scene-canvas");
const sidebarTextEl = document.getElementById("sidebar-text");
const scrollHintEl = document.getElementById("scroll-hint");
const quoteEls = Array.from(document.querySelectorAll(".quote-card"));
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
  const drawn = drawQuestScene(ctx, width, height, current, animate, quoteEls);
  if (drawn) drawnOnce = true;
}

function updateScrollHint() {
  const canScroll = sidebarTextEl.scrollHeight > sidebarTextEl.clientHeight + 1;
  scrollHintEl.hidden = !canScroll;

  if (!canScroll) return;

  const atBottom = sidebarTextEl.scrollTop + sidebarTextEl.clientHeight >= sidebarTextEl.scrollHeight - 2;
  scrollHintEl.querySelector(".scroll-hint-arrow").textContent = atBottom ? "↑" : "↓";
  scrollHintEl.querySelector(".scroll-hint-label").textContent = atBottom ? "Scroll to top" : "Scroll for more";
}

function render() {
  textEl.textContent = pages[current];
  counterEl.textContent = (current + 1) + "/" + pages.length;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === pages.length - 1;
  pageQuotes[current].forEach((quote, index) => {
    quoteEls[index].querySelector(".quote-content").textContent = quote.text;
    quoteEls[index].querySelector(".quote-page").textContent = "page " + quote.page;
  });
  sidebarTextEl.scrollTop = 0;
  drawScene();
  updateScrollHint();
}

sidebarTextEl.addEventListener("scroll", updateScrollHint, { passive: true });
scrollHintEl.addEventListener("click", () => {
  const atBottom = sidebarTextEl.scrollTop + sidebarTextEl.clientHeight >= sidebarTextEl.scrollHeight - 2;
  sidebarTextEl.scrollTo({
    top: atBottom ? 0 : sidebarTextEl.scrollHeight,
    behavior: "smooth",
  });
});

if ("ResizeObserver" in window) {
  new ResizeObserver(updateScrollHint).observe(sidebarTextEl);
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
    updateScrollHint();
  });
}

if (window.questAssetsReady) {
  window.questAssetsReady.then(() => {
    if (!drawnOnce) drawScene(true);
  });
}
