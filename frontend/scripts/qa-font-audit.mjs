import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const paths = ["/", "/year/1066", "/era/era-14", "/stratum", "/methodology"];
for (const p of paths) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const tiny = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length) continue;
      const text = el.textContent?.trim() ?? "";
      if (!text || text.length < 2) continue;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs < 14) {
        const parent = el.closest("[class]");
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 60),
          parentCls: String(parent?.className ?? "").slice(0, 60),
          fs: cs.fontSize,
          sample: text.slice(0, 40),
        });
        if (out.length >= 20) break;
      }
    }
    return out;
  });
  console.log(`\n=== ${p} (${tiny.length} tiny) ===`);
  for (const t of tiny) console.log(`  ${t.fs.padEnd(8)} ${t.tag} .${t.cls} :: "${t.sample}"`);
}
await browser.close();
