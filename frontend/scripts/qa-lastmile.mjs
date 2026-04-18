import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// -------------------------------------------------
// TEST 1 — Row-2024 clipping dead-zone
// Deep-link-ish case: scroll such that a row's CLICKABLE <a> is partly
// under the sticky chrome. Does elementFromPoint on the chrome-covered
// area resolve to the row or to the chrome?
// -------------------------------------------------
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

// Scroll so a row's title is exactly aligned with the bottom edge of the chrome
const clipReport = await page.evaluate(() => {
  const chrome = document.querySelector(".chronograph-chrome");
  const chromeRect = chrome.getBoundingClientRect();
  const chromeBottom = chromeRect.bottom; // px within viewport
  // Find a .notebook-row-link whose title top is within [chromeBottom-40, chromeBottom]
  // i.e. the title is BURIED under the chrome
  const rows = Array.from(document.querySelectorAll(".notebook-row-link"));
  // Walk forward until we find one where the TITLE is under the chrome
  for (const row of rows) {
    const title = row.querySelector(".notebook-row-title");
    if (!title) continue;
    const t = title.getBoundingClientRect();
    if (t.top < chromeBottom && t.bottom > chromeBottom - 10) {
      // Title is partially or wholly under chrome. Try to click at the
      // title's apparent coords.
      const clickX = t.left + 40;
      const clickY = t.top + t.height / 2;
      const topElement = document.elementFromPoint(clickX, clickY);
      return {
        chromeBottom,
        titleTop: t.top,
        titleBottom: t.bottom,
        clickX,
        clickY,
        topElementTag: topElement?.tagName,
        topElementClass: topElement?.className,
        topElementWithinLink: !!topElement?.closest(".notebook-row-link"),
        topElementWithinChrome: !!topElement?.closest(".chronograph-chrome"),
        href: row.getAttribute("href"),
      };
    }
  }
  return { note: "no row found under chrome at this scroll" };
});

// If no row is clipped at current scroll, nudge scroll and retry
let clipFinal = clipReport;
if (clipFinal.note) {
  await page.evaluate(() => window.scrollTo(0, 1420));
  await page.waitForTimeout(300);
  clipFinal = await page.evaluate(() => {
    const chrome = document.querySelector(".chronograph-chrome");
    const chromeBottom = chrome.getBoundingClientRect().bottom;
    const rows = Array.from(document.querySelectorAll(".notebook-row-link"));
    for (const row of rows) {
      const title = row.querySelector(".notebook-row-title");
      if (!title) continue;
      const t = title.getBoundingClientRect();
      if (t.top < chromeBottom && t.bottom > chromeBottom - 10) {
        const clickX = t.left + 40;
        const clickY = t.top + t.height / 2;
        const topElement = document.elementFromPoint(clickX, clickY);
        return {
          chromeBottom,
          titleTop: t.top,
          titleBottom: t.bottom,
          clickX,
          clickY,
          topElementTag: topElement?.tagName,
          topElementClass: String(topElement?.className).slice(0, 80),
          topElementWithinLink: !!topElement?.closest(".notebook-row-link"),
          topElementWithinChrome: !!topElement?.closest(".chronograph-chrome"),
          href: row.getAttribute("href"),
        };
      }
    }
    return { note: "still none" };
  });
}
console.log("\n=== TEST 1 — chrome clipping dead-zone ===");
console.log(JSON.stringify(clipFinal, null, 2));

// Now attempt a REAL click at that location and see if it navigates.
if (clipFinal.clickX && clipFinal.clickY) {
  const startUrl = page.url();
  try {
    await page.mouse.click(clipFinal.clickX, clipFinal.clickY);
    await page.waitForTimeout(800);
    const endUrl = page.url();
    console.log(`click start=${startUrl}`);
    console.log(`click end  =${endUrl}`);
    console.log(`navigated: ${startUrl !== endUrl}`);
  } catch (e) {
    console.log(`click error: ${e.message}`);
  }
}

// -------------------------------------------------
// TEST 2 — Globe trackpad pinch-zoom vs browser zoom
// Simulate pinch via ctrl+wheel (Chrome/Safari trackpad pinches fire
// ctrl+wheel events on the canvas). Does the globe's wheel handler
// intercept, or does the browser zoom the page?
// -------------------------------------------------
await page.goto(BASE + "/?view=map", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const canvas = await page.$(".gs-canvas");
const box = await canvas?.boundingBox();
const pinchReport = { canvasBox: box };

if (box) {
  // Scroll the canvas into view first — otherwise the mouse can't target it
  await page.evaluate(() => {
    document.querySelector(".gs-canvas")?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(400);
  const box2 = await canvas.boundingBox();
  const mx = box2.x + box2.width / 2;
  const my = box2.y + box2.height / 2;
  pinchReport.canvasBoxAfterScroll = box2;

  const zoomBefore = await page.$eval(
    ".gs-zoom-ind",
    (el) => el.textContent?.trim() ?? null,
  ).catch(() => null);

  await page.mouse.move(mx, my);
  // Playwright's first-class wheel API — fires a TRUSTED wheel event
  // through the browser, same as a real trackpad gesture on most systems.
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(200);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(400);

  const zoomAfter = await page.$eval(
    ".gs-zoom-ind",
    (el) => el.textContent?.trim() ?? null,
  ).catch(() => null);

  pinchReport.zoomBefore = zoomBefore;
  pinchReport.zoomAfter = zoomAfter;
  // Confirm the canvas handler swallowed the event (page shouldn't scroll)
  pinchReport.windowScrollY = await page.evaluate(() => window.scrollY);
  pinchReport.browserZoom = await page.evaluate(() => ({
    visualViewportScale: window.visualViewport?.scale,
    devicePixelRatio: window.devicePixelRatio,
  }));

  // Also simulate pinch via ctrl+wheel (real trackpad pinches fire
  // ctrl+wheel in Chromium). Verify the page doesn't zoom.
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -240);
  await page.keyboard.up("Control");
  await page.waitForTimeout(300);
  pinchReport.zoomAfterPinch = await page.$eval(
    ".gs-zoom-ind",
    (el) => el.textContent?.trim() ?? null,
  ).catch(() => null);
  pinchReport.browserZoomAfterPinch = await page.evaluate(() => ({
    visualViewportScale: window.visualViewport?.scale,
    devicePixelRatio: window.devicePixelRatio,
  }));
}

console.log("\n=== TEST 2 — globe trackpad pinch ===");
console.log(JSON.stringify(pinchReport, null, 2));

// -------------------------------------------------
// TEST 3 — Deep-link simulation: open /year/1066 and confirm all UI is
// visible and clickable (no chrome dead-zone near top).
// -------------------------------------------------
await page.goto(BASE + "/year/1066", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const deepLink = await page.evaluate(() => {
  const back = document.querySelector(".notebook-folio-back");
  const t = back?.getBoundingClientRect();
  const chrome = document.querySelector(".chronograph-chrome");
  const chromeBottom = chrome.getBoundingClientRect().bottom;
  return {
    backLinkTop: t?.top,
    chromeBottom,
    clearGap: (t?.top ?? 0) - chromeBottom,
    backVisible: t ? t.top > chromeBottom : false,
  };
});
console.log("\n=== TEST 3 — /year/[id] deep-link usability ===");
console.log(JSON.stringify(deepLink, null, 2));

await browser.close();
