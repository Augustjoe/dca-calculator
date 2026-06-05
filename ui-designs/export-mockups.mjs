import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "mockups.html");
const url = `file:///${htmlPath.replaceAll("\\", "/")}`;

const shots = [
  { selector: "#desktop-main", file: "01-desktop-single-buy.png", width: 1440, height: 1024 },
  { selector: "#desktop-dca", file: "02-desktop-dca-plan.png", width: 1440, height: 1024 },
  { selector: "#desktop-detail", file: "03-desktop-dca-detail.png", width: 1440, height: 1024 },
  { selector: "#mobile-main", file: "04-mobile-single-buy.png", width: 390, height: 1080 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, deviceScaleFactor: 1 });
await page.goto(url);

for (const shot of shots) {
  await page.setViewportSize({ width: Math.max(shot.width + 80, 500), height: Math.max(shot.height + 80, 900) });
  const locator = page.locator(shot.selector);
  await locator.screenshot({
    path: path.join(__dirname, shot.file),
    animations: "disabled",
  });
}

await browser.close();
