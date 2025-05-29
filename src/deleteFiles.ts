const fs = require('fs')
import colors from 'yoctocolors';

// This script deletes specified files from the filesystem.
export const deleteFiles = (files: string[]) => {
    console.log(colors.bgBlue('Deleting files:'));
    files.forEach(file => {
        try {
            fs.unlinkSync(file);
            console.log(colors.bgBlue(`Deleted file: ${file}`));
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'ENOENT') {
                console.warn(colors.yellow(`File not found: ${file}`));
            } else {
            console.error(colors.red(`Error deleting file ${file}:, ${error}`));
        }
    }
});

}
