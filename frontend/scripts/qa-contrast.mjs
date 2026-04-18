import { chromium } from "playwright";

function srgbToLin(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(rgb) {
  const [r, g, b] = rgb;
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function contrast(fg, bg) {
  const L1 = luminance(fg) + 0.05;
  const L2 = luminance(bg) + 0.05;
  return L1 > L2 ? L1 / L2 : L2 / L1;
}
function parseRgb(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map((x) => parseFloat(x.trim()));
  return [p[0], p[1], p[2]];
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/?view=map", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Click on any dot to open the rail with a selected event
const canvas = await page.$(".gs-canvas");
if (canvas) {
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  // Pick a location likely to have a cluster (Europe roughly)
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await page.waitForTimeout(500);
}

const audit = await page.evaluate(() => {
  const targets = [
    ".gs-rail-title",
    ".gs-rail-kicker",
    ".gs-rail-row .lbl",
    ".gs-rail-row .val",
    ".gs-rail-row .val.cat",
    ".gs-rail-footer",
    ".gs-rail-body p",
    ".gs-chip .k",
    ".gs-chip .v",
    ".gs-legend-title",
    ".gs-legend-item",
  ];
  const out = [];
  for (const sel of targets) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    let bg = "rgba(0,0,0,0)";
    let bgEl = el;
    while (bgEl) {
      const b = getComputedStyle(bgEl).backgroundColor;
      if (b && b !== "rgba(0, 0, 0, 0)" && !b.startsWith("rgba(0,0,0,0")) { bg = b; break; }
      bgEl = bgEl.parentElement;
    }
    out.push({ sel, color: cs.color, bg, fs: cs.fontSize, text: el.textContent?.trim().slice(0, 40) ?? "" });
  }
  return out;
});

for (const a of audit) {
  const fg = parseRgb(a.color);
  const bg = parseRgb(a.bg) ?? [6, 9, 13];
  if (!fg) continue;
  const ratio = contrast(fg, bg).toFixed(2);
  const fs = parseFloat(a.fs);
  const large = fs >= 18 || (fs >= 14 && a.sel.includes("title"));
  const pass = large ? ratio >= 3 : ratio >= 4.5;
  console.log(`${pass ? "✓" : "✗"} ${ratio.padStart(6)} ${a.sel.padEnd(30)} fs=${a.fs.padEnd(6)} "${a.text}"`);
}
await browser.close();
