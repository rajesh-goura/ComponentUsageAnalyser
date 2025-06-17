
import colors from 'yoctocolors';
import { Component } from '../types/types';

const isExpoRoutedComponent = (file: string): boolean => {
  const normalized = file.replace(/\\/g, '/');
  return (
    normalized.startsWith('app/') &&
    (
      /(_layout|index|\[.+\])\.(tsx|jsx)$/.test(normalized) || // _layout, index, dynamic
      /\/\(.+\)\//.test(normalized)                      // folder like (auth), (tabs)
    )
  );
};

/**
 * Marks components as used if they are implicitly used by Expo Router.
 */
export function markExpoRouterUsages(components: Component[]) {
  const implicitlyUsedFiles: string[] = [];

  for (const comp of components) {
    if (isExpoRoutedComponent(comp.file)) {
        console.log("comp", comp.file, "is Expo routed component");
      comp.isUsed = true;
      comp.usageCount += 1;
      comp.usedIn = [...(comp.usedIn || []), comp.file];
      implicitlyUsedFiles.push(comp.file);
    }
  }

  if (implicitlyUsedFiles.length > 0) {
    console.log(colors.cyan(`\n🔄 Marked ${implicitlyUsedFiles.length} Expo Router components as implicitly used:`));
    implicitlyUsedFiles.forEach(file => {
      console.log(colors.gray(`  - ${file}`));
    });
  }
}
