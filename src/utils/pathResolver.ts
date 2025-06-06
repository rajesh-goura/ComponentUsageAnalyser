import path from "path";

// Function to determine the project root directory
function getProjectRoot(scanPath: string): string {
  const absolutePath = path.resolve(scanPath);
  const coinPayIndex = absolutePath.indexOf('CoinPay');
  
  if (coinPayIndex !== -1) {
    return path.join(absolutePath.substring(0, coinPayIndex), 'CoinPay');
  }
  return absolutePath;
}

// Function to get the relative path of a file from the project root
function getRelativePath(fullPath: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, fullPath);
  return relativePath.startsWith('..') ? fullPath : `CoinPay/${relativePath}`;
}

export { getProjectRoot, getRelativePath };