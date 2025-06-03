import fs from 'fs';
import colors from 'yoctocolors';

// Delete specified files and return a list of successfully deleted ones
export const deleteFiles = (files: string[]): string[] => {
  const deletedFiles: string[] = [];

  files.forEach(file => {
    try {
      fs.unlinkSync(file);
      deletedFiles.push(file);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'ENOENT') {
        console.warn(colors.yellow(`File not found: ${file}`));
      } else {
        console.error(colors.red(`Error deleting file ${file}: ${error}`));
      }
    }
  });
  return deletedFiles;
};
