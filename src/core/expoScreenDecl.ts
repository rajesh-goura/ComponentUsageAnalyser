import { Component } from "../types/types";
import fs from 'fs';
import path from 'path';

export function trackExpoScreens(filePath: string, components: Component[]) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const screenRegex = /<\w+\.Screen\s+[^>]*name=["'](.+?)["']/g;

  let match;

  while ((match = screenRegex.exec(code))) {
    const screenName = match[1]; // e.g. "search/[query]" or "Home"
    const possibleFiles = [
      `app/${screenName}.tsx`,
      `app/${screenName}.jsx`,
      `app/${screenName}/index.tsx`,
      `app/${screenName}/index.jsx`,
    ];

    for (const file of possibleFiles) {
      const comp = components.find(c => c.file.replace(/\\/g, '/') === file);
      if (comp) {
        console.log(`📌 Marking component ${comp.name} as used in Expo Router screen: ${file}`);
        comp.isUsed = true;
        comp.usageCount += 1;
        comp.usedIn = comp.usedIn || [];
        comp.usedIn.push(`[expo-router: referenced in ${path.relative(process.cwd(), filePath)}]`);
      }
    }
  }
}
