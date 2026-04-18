import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", e => console.log("PAGE-ERROR:", e.message));
page.on("console", m => { if (m.type() === "error") console.log("CONSOLE:", m.text()); });
await page.goto("http://localhost:3000/?view=map", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => ({
  url: window.location.href,
  scrollY: window.scrollY,
  hasGsRoot: !!document.querySelector(".gs-root"),
  hasGsCanvas: !!document.querySelector(".gs-canvas"),
  hasGsStage: !!document.querySelector(".gs-stage"),
  html: document.querySelector(".gs-root")?.outerHTML?.slice(0, 500),
  bodyClass: document.body.className,
  anyMotionMap: Array.from(document.querySelectorAll("[key='map']")).length,
}));
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "/tmp/chrono-qa/debug-globe.png" });
await browser.close();
