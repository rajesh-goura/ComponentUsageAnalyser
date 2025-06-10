import path from "path";
import fs from "fs";
import colors from "yoctocolors";
import markdownpdf, { Options } from "markdown-pdf";

interface Component {
  name: string;
  file: string;
  isUsed: boolean;
  usageCount: number;
  usedIn?: string[];
}

async function writeMarkdownReport(components: Component[], outputPath = "component-report.md") {
  const used = components.filter(c => c.isUsed);
  const unused = components.filter(c => !c.isUsed);
  const total = components.length;
  const usagePercentage = Math.round((used.length / total) * 100);

  // Generate a timestamp for the report
  const reportDate = new Date().toLocaleString();

  // Sort by usage count to get top used components
  const topUsed = [...used].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

  let content = `<!-- 
This content is hidden in both markdown and PDF output
-->
<style>
  .page-break {
    page-break-after: always;
    visibility: hidden;
    height: 0;
  }
  .summary-box {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 5px solid #4285F4;
    margin-bottom: 20px;
  }
  .component-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    table-layout: fixed;
  }
  .component-table th:nth-child(1),
  .component-table td:nth-child(1) {
    width: 25%;
  }
  .component-table th:nth-child(2),
  .component-table td:nth-child(2) {
    width: 15%;
    text-align: center;
  }
  .component-table th:nth-child(3),
  .component-table td:nth-child(3) {
    width: 60%;
    word-break: break-word;
  }
  .component-table th {
    background-color: #f5f5f5;
    padding: 12px;
    border-bottom: 2px solid #ddd;
  }
  .component-table td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .component-name {
    font-size: 0.9em;
  }
  .used-components {
    background-color: #e8f5e9;
    border-radius: 8px;
    padding: 1px 15px;
    margin: 20px 0;
  }
  .unused-components {
    background-color: #ffebee;
    border-radius: 8px;
    padding: 1px 15px;
    margin: 20px 0;
  }
  .top-components {
    background-color: #f3f4f6;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
  }
  .file-path {
    display: inline-block;
    max-width: 100%;
    word-break: break-all;
    white-space: normal;
  }
  .report-title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  .key-metric {
    font-size: 1.2em;
    margin: 15px 0;
    padding: 10px;
    border-radius: 5px;
  }
  .metric-positive {
    background-color: #e8f5e9;
    border-left: 4px solid #4CAF50;
  }
  .metric-warning {
    background-color: #fff3e0;
    border-left: 4px solid #FF9800;
  }
  .metric-negative {
    background-color: #ffebee;
    border-left: 4px solid #F44336;
  }
  .graph-section {
    margin: 20px 0;
    page-break-inside: avoid;
  }
</style>

<div class="report-title">📊 Component Usage Analysis Report</div>  
**Generated on:** ${reportDate}  

## 🏆 Executive Summary

<div class="summary-box">

| Metric               | Value                     |
|----------------------|---------------------------|
| **Total Components** | ${total}                 |
| **Used Components**  | ${used.length} (${usagePercentage}%) |
| **Unused Components**| ${unused.length}         |

</div>

**Key Metrics:**

${used.length > unused.length ? `
<div class="key-metric metric-positive">
✅ <strong>${usagePercentage}% Utilization Rate</strong> - Most components are being used effectively
</div>
` : `
<div class="key-metric metric-warning">
⚠️ <strong>${usagePercentage}% Utilization Rate</strong> - Many components appear unused
</div>
`}

${unused.length > 0 ? `
<div class="key-metric metric-negative">
🔍 <strong>${unused.length} Unused Components</strong> - Potential for cleanup and optimization
</div>
` : `
<div class="key-metric metric-positive">
🎉 <strong>100% Utilization</strong> - All components are being used!
</div>
`}

<div class="page-break"></div>

## 📊 Dependency Visualization

<div class="graph-section">
###

![Component Graph](./component-graph.png)

**Graph Legend:**
- 🟢 <strong>Green nodes</strong>: Used components
- 🔴 <strong>Red nodes</strong>: Unused components
- ➡️ <strong>Lines</strong>: Dependency relationships
</div>

<div class="page-break"></div>

## 🏅 MOST USED

### Top 5 Most Used Components

<div class="top-components">

${topUsed.map((comp, index) => `
**${index + 1}. ${comp.name}**  
🔹 **Usage count:** ${comp.usageCount}  
🔹 **Used in:** ${comp.usedIn?.slice(0, 2).join(', ') ?? 'N/A'}${comp.usedIn && comp.usedIn.length > 2 ? '...' : ''}
`).join('\n\n')}

</div>


## 📋 Component Inventory

### Used Components (${used.length})

<div class="used-components">
<table class="component-table">
  <tr>
    <th>Component</th>
    <th>Usage Count</th>
    <th>Used In</th>
  </tr>
${used.sort((a, b) => b.usageCount - a.usageCount).map(comp => `
  <tr>
    <td><span class="component-name"><strong>${comp.name}</strong></span></td>
    <td>${comp.usageCount}</td>
    <td>${comp.usedIn?.slice(0, 3).join(', ') ?? 'N/A'}${comp.usedIn && comp.usedIn.length > 3 ? '...' : ''}</td>
  </tr>
`).join('')}
</table>
</div>

### Unused Components (${unused.length})

<div class="unused-components">
<table class="component-table">
  <tr>
    <th>Component</th>
    <th>Potential Action</th>
  </tr>
${unused.map(comp => `
  <tr>
    <td><span class="component-name"><strong>${comp.name}</strong></span></td>
    <td>🚫 Mark for deletion</td>
  </tr>
`).join('')}
</table>
</div>

<div class="page-break"></div>

## 🚀 Recommendations

${unused.length > 0 ? `
### 🗑️ Cleanup Opportunities
1. Consider removing these unused components:
   ${unused.slice(0, 5).map(comp => `- **${comp.name}**`).join('\n   ')}
   ${unused.length > 5 ? `\n   *...and ${unused.length - 5} more unused components*` : ''}

2. Run with \`--deleteUnused\` flag to automatically remove these components.
` : '🎉 No unused components found - great job!'}

### 🔍 Optimization Suggestions
1. Review the most used components for potential abstraction or optimization
2. Check for circular dependencies in the component graph
3. Consider creating shared components for frequently used patterns

---

**Report generated by Component Analyzer Tool**  
**Version:** 1.0.0  
**Generated on:** ${reportDate}
`;

  // Write markdown to file
  const fullPath = path.join(process.cwd(), outputPath);
  fs.writeFileSync(fullPath, content, "utf8");

  // Generate CSS content for PDF
  const cssContent = `
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0 auto;
      padding: 20px;
      max-width: 100%;
    }
    
    h1, h2, h3 {
      color: #2c3e50;
    }
    
    .component-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      table-layout: fixed;
    }
    
    .component-table th:nth-child(1),
    .component-table td:nth-child(1) {
      width: 25%;
    }
    
    .component-table th:nth-child(2),
    .component-table td:nth-child(2) {
      width: 15%;
      text-align: center;
    }
    
    .component-table th:nth-child(3),
    .component-table td:nth-child(3) {
      width: 60%;
      word-break: break-word;
    }
    
    .component-table th {
      background-color: #f5f5f5;
      padding: 12px;
      border-bottom: 2px solid #ddd;
    }
    
    .component-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    
    .component-name {
      font-size: 0.9em;
    }
    
    .summary-box {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 5px solid #4285F4;
      margin-bottom: 20px;
    }
    
    .used-components {
      background-color: #e8f5e9;
      border-radius: 8px;
      padding: 1px 15px;
      margin: 20px 0;
    }
    
    .unused-components {
      background-color: #ffebee;
      border-radius: 8px;
      padding: 1px 15px;
      margin: 20px 0;
    }
    
    .top-components {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .key-metric {
      font-size: 1.2em;
      margin: 15px 0;
      padding: 10px;
      border-radius: 5px;
    }
    
    .metric-positive {
      background-color: #e8f5e9;
      border-left: 4px solid #4CAF50;
    }
    
    .metric-warning {
      background-color: #fff3e0;
      border-left: 4px solid #FF9800;
    }
    
    .metric-negative {
      background-color: #ffebee;
      border-left: 4px solid #F44336;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .graph-section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
  `;

  // Write CSS to temporary file
  const cssPath = path.join(__dirname, 'temp-report-styles.css');
  fs.writeFileSync(cssPath, cssContent, 'utf8');

  // Generate PDF
  const pdfPath = fullPath.replace(/\.md$/, ".pdf");
  const pdfOptions: Options = {
    cssPath: cssPath,
    paperBorder: '2cm',
    paperFormat: 'A4',
    renderDelay: 1000,
    remarkable: {
      html: true
    }
  };

  try {
    await new Promise<void>((resolve, reject) => {
      markdownpdf(pdfOptions)
        .from.string(content)
        .to(pdfPath, (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });

    console.log(colors.bgGreen(`Professional PDF report generated at ${pdfPath}`));
  } catch (err) {
    console.error(colors.bgRed('PDF generation error:'), err);
    throw err;
  } finally {
    // Clean up temporary CSS file
    if (fs.existsSync(cssPath)) {
      fs.unlinkSync(cssPath);
    }
  }

  console.log(colors.bgGreen(`\nEnhanced markdown report generated at ${outputPath}`));
}

export { writeMarkdownReport };