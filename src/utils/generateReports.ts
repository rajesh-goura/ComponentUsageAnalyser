import ora from "ora";
import { visualizeComponents } from "../output/visualizer";
import { generateGraphScreenshot } from "./GenerateGraphScreenShot";
import { writeMarkdownReport } from "../output/writeMarkdown";

async function generateReportFiles(components: any[]) {
  const spinner1 = ora("Generating visualizer...").start();
  await visualizeComponents(components);
  spinner1.succeed(`✅ Visualizer generated, opening in browser...`);
  
  const spinner2 = ora("Generating reports...").start();
  await generateGraphScreenshot();
  
  writeMarkdownReport(components);
  spinner2.succeed(`almost there, hang tight!`);
}

export { generateReportFiles };