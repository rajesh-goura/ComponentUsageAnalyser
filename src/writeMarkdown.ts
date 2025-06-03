import path from "path";
import fs from "fs";
import colors from "yoctocolors";
import markdownpdf from "markdown-pdf";

// Function to write a markdown report of component usage
function writeMarkdownReport(components: any[], outputPath = "component-report.md") {
  const used = components.filter(c => c.isUsed);
  const unused = components.filter(c => !c.isUsed);
  const total = components.length;

  let content = `# 📦 Component Usage Report\n\n`;

  // Summary as a table
  content += `## 🧾 Summary\n`;
  content += `| Metric | Count |\n`;
  content += `|--------|-------|\n`;
  content += `| Total Components | ${total} |\n`;
  content += `| Used Components  | ${used.length} |\n`;
  content += `| Unused Components| ${unused.length} |\n\n`;

  // Top used components
  const topUsed = [...used].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  if (topUsed.length > 0) {
    content += `---\n\n`;
    content += `## 🔝 Top 5 Most Used Components\n`;
    topUsed.forEach((comp, index) => {
      content += `**${index + 1}. ${comp.name}** — \`${comp.usageCount} usage${comp.usageCount !== 1 ? 's' : ''}\`\n`;
      if (comp.usedIn?.length) {
        content += `> 📁 Used in: ${comp.usedIn.join(', ')}\n`;
      }
      content += `\n`;
    });
  }

  // All components
  content += `---\n\n`;
  content += `## 📋 All Components\n`;
  components.forEach(comp => {
    const usageLabel = comp.isUsed
      ? `🟢 **USED** — \`${comp.usageCount} time${comp.usageCount !== 1 ? 's' : ''}\``
      : `🔴 **UNUSED**`;
    content += `- **${comp.name}** (${comp.file}) — ${usageLabel}\n`;
    if (comp.isUsed && comp.usedIn?.length) {
      content += `  - 📁 Used in ${comp.usedIn.length} file${comp.usedIn.length !== 1 ? 's' : ''}: ${comp.usedIn.join(', ')}\n`;
    }
  });
  content += `\n`;

  // Unused components (optional duplication for visibility)
  if (unused.length > 0) {
    content += `---\n\n`;
    content += `## 🚫 Unused Components (${unused.length})\n`;
    unused.forEach(comp => {
      content += `- **${comp.name}** (${comp.file})\n`;
    });
    content += `\n`;
    content += 'Please run: `--deleteUnused` to remove these unused components.\n';
  }

  // Write to file
  const fullPath = path.join(process.cwd(), outputPath);
  fs.writeFileSync(fullPath, content, "utf8");

  const pdfPath = fullPath.replace(/\.md$/, ".pdf");
  markdownpdf()
    .from(fullPath)
    .to(pdfPath, () => {
      console.log(colors.bgGreen(`PDF report generated at ${pdfPath}`));
    });

  console.log(colors.bgGreen(`\nMarkdown report generated at ${outputPath}`));
}

export { writeMarkdownReport };
