import puppeteer from "puppeteer";
import path from "path";

// Function to generate a screenshot of the component graph from an HTML file
export async function generateGraphScreenshot(
  htmlPath: `${string}.html` = "component-graph.html",
  outputImage: `${string}.png` | `${string}.jpeg` | `${string}.webp` = "component-graph.png"
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Resolve the absolute path of the HTML file
  const absPath = path.resolve(htmlPath);
  await page.goto(`file://${absPath}`, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 700, height: 700 });

  await page.screenshot({ path: outputImage });
  await browser.close();
}
