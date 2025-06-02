import colors from 'yoctocolors';

//function to display analysis results in a user-friendly format
function displayAnalysisResults(components: any[]) {
  if (components.length === 0) {
    console.log(colors.bgYellow('No components found in the specified path.'));
    return;
  }

  const usedComponents = components.filter(c => c.isUsed);
  const unusedComponents = components.filter(c => !c.isUsed);

  // Displaying results
  console.log(colors.bgBlue('\nFound components:'));
  components.forEach(comp => {
    const usageInfo = comp.isUsed 
      ? `[USED ${comp.usageCount} time${comp.usageCount !== 1 ? 's' : ''}]` 
      : '[UNUSED]';
    console.log(colors.green(`- ${comp.name} (${comp.file}) ${usageInfo}`));
    if (comp.isUsed && comp.usedIn?.length) {
      console.log(colors.cyan(`  ↳ Used in: ${comp.usedIn.length} file${comp.usedIn.length !== 1 ? 's' : ''}`));
    }
  });

  console.log(colors.bgBlue('\nSummary:'));
  console.log(colors.blue(`- Total components: ${components.length}`));
  console.log(colors.green(`- Used components: ${usedComponents.length}`));
  console.log(colors.red(`- Unused components: ${unusedComponents.length}`));
  
  // Show top 5 most used components
  const topUsed = [...usedComponents]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);
    
  if (topUsed.length > 0) {
    console.log(colors.bgMagenta('\nTop Used Components:'));
    topUsed.forEach((comp, index) => {
      console.log(colors.magenta(`${index + 1}. ${comp.name}: ${comp.usageCount} usage${comp.usageCount !== 1 ? 's' : ''}`));
      if (comp.usedIn?.length) {
        console.log(colors.gray(`  ↳ Used in: ${comp.usedIn.join(', ')}`));
      }
    });
  }

  // Show unused components
  if (unusedComponents.length > 0) {
    console.log(colors.bgRed('\nUnused components:'));
    unusedComponents.forEach(comp => {
      console.log(colors.red(`- ${comp.name} (${comp.file})`));
    });
  }

  return unusedComponents;
}

export { displayAnalysisResults };