import fs from 'fs';
import open from 'open';
import { Component } from './types';

// Function to visualize components and their usage in a graph
export async function visualizeComponents(components: Component[], outputPath: string = 'component-graph.html') {
  const graphData = prepareGraphData(components);
  const html = generateEnhancedHtmlTemplate(graphData);
  // Write the HTML to the specified output path
  fs.writeFileSync(outputPath, html);
  await open(outputPath, { wait: false });
}

// Function to prepare graph data from components
function prepareGraphData(components: Component[]) {
  const nodes = components.map(comp => ({
    data: {
      id: comp.name,
      name: comp.name,
      isUsed: comp.isUsed,
      usageCount: comp.usageCount || 0
    }
  }));

  const edges: any[] = [];
  const edgeKeys = new Set<string>();

  for (const comp of components) {
    if (!comp.usedIn) continue;
    
    for (const usagePath of comp.usedIn) {
      const usedInComp = components.find(c => 
        c.file && usagePath.includes(c.file.replace(/\.\w+$/, ''))
      );
      
      if (usedInComp && usedInComp.name !== comp.name) {
        const edgeKey = `${usedInComp.name}->${comp.name}`;
        if (!edgeKeys.has(edgeKey)) {
          edges.push({
            data: {
              id: edgeKey,
              source: usedInComp.name,
              target: comp.name
            }
          });
          edgeKeys.add(edgeKey);
        }
      }
    }
  }

  return { nodes, edges };
}

// Function to generate the HTML template for the graph visualization
function generateEnhancedHtmlTemplate(graphData: any) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Component Graph</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.23.0/cytoscape.min.js"></script>
  <style>
    body { 
      margin: 0;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }
    #cy {
      width: 100vw;
      height: 100vh;
      display: block;
      background-color: #f8f9fa;
    }
    .legend {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: 8px 0;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      border-radius: 50%;
      border: 2px solid #fff;
    }
    .legend-text {
      font-size: 14px;
    }
    .legend-title {
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
  </style>
</head>
<body>
  <div id="cy"></div>

  <div class="legend">
    <div class="legend-title">Component Legend</div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #4285F4;"></div>
      <div class="legend-text">Used Component</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #EA4335;"></div>
      <div class="legend-text">Unused Component</div>
    </div>
    <div class="legend-item">
      <div style="width: 20px; height: 1px; background-color: #A1A1A1; margin-right: 10px;"></div>
      <div class="legend-text">Dependency</div>
    </div>
    <div class="legend-item">
      <div style="width: 20px; height: 20px; margin-right: 10px; display: flex; align-items: center; justify-content: center;">
        <div style="font-size: 12px;">S</div>
      </div>
      <div class="legend-text">Small Node = Low Usage</div>
    </div>
    <div class="legend-item">
      <div style="width: 20px; height: 20px; margin-right: 10px; display: flex; align-items: center; justify-content: center;">
        <div style="font-size: 16px;">L</div>
      </div>
      <div class="legend-text">Large Node = High Usage</div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      try {
        const cy = cytoscape({
          container: document.getElementById('cy'),
          elements: {
            nodes: ${JSON.stringify(graphData.nodes)},
            edges: ${JSON.stringify(graphData.edges)}
          },
          style: [
            {
              selector: 'node',
              style: {
                'label': 'data(name)',
                'width': 'mapData(usageCount, 0, 10, 30, 80)',
                'height': 'mapData(usageCount, 0, 10, 30, 80)',
                'background-color': function(ele) { 
                  return ele.data('isUsed') ? '#4285F4' : '#EA4335'; 
                },
                'text-valign': 'center',
                'text-halign': 'center',
                'color': 'white',
                'font-size': '12px',
                'text-outline-color': '#555',
                'text-outline-width': '2px',
                'border-color': '#fff',
                'border-width': '2px'
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 1,
                'line-color': '#A1A1A1',
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#A1A1A1'
              }
            }
          ],
          layout: {
            name: 'cose',
            idealEdgeLength: 100,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
          }
        });

        // Fit the graph to viewport when ready
        cy.ready(function() {
          cy.fit();
        });

        // Add some basic zoom controls
        document.addEventListener('keydown', function(e) {
          if(e.key === '+') {
            cy.zoom(cy.zoom() * 1.2);
          } else if(e.key === '-') {
            cy.zoom(cy.zoom() * 0.8);
          } else if(e.key === '0') {
            cy.fit();
          }
        });

      } catch (error) {
        console.error('Graph error:', error);
      }
    });
  </script>
</body>
</html>`;
}