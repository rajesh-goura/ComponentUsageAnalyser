# 📦 CUA Tool - Component Usage Analyzer Tool

A powerful Command Line Interface (CLI) utility designed to scan React and React Native codebases. It helps developers analyze component usage, identify unused components, and even automate the deletion of those components. This tool is invaluable for maintaining clean, efficient, and optimized front-end projects.

---

## 🚀 Features

- **Component Usage Analysis:** Scans your entire codebase to identify all React/React Native components.
- **Detailed Usage Tracking:** Determines whether a component is used, how many times it's used, and in which files.
- **Unused Component Detection:** Highlights components that are defined but never utilized, helping you identify dead code.
- **Interactive Deletion:** Provides an interactive prompt to confirm the deletion of unused component files.
- **Markdown Report Generation:** Generates a comprehensive Markdown report of component usage.
- **PDF Report Generation:** Automatically converts the Markdown report into a PDF.

---

## 🛠️ Usage

### CLI Options

```bash
cua --help
```

- `-a, --analyze [path]`: Scan codebase for component usage.
- `-d, --deleteUnused [path]`: Delete unused components after confirmation.
- `-g, --generateReport [path]`: Generate Markdown and PDF usage report.

_please note_ -> providing path is optional, if not given the tool scans through the current working directory

### Examples

```bash
cua --analyze ./src
cua --deleteUnused ./components
cua --generateReport ./app
```

---

## 📊 Understanding the Output

### Console Output (`--analyze`)

- Color-coded summary
- Used vs Unused components
- Top 5 used components
- Usage count and file locations

### Markdown/PDF Report

- Summary Table
- Top 5 Used Components
- All Components: name, file, usage, locations
- Unused Components List

---

## 💡 How it Works

The CUA Tool leverages `@babel/parser` and `@babel/traverse`:

### 1. Component Collection

- Parses `.jsx` and `.tsx` using plugins: `jsx`, `typescript`, `decorators-legacy`, `classProperties`
- Finds:
  - `FunctionDeclaration`
  - `VariableDeclarator`
  - `ClassDeclaration`
- Sets `isUsed: false` and `usageCount: 0`

### 2. Usage Tracking

- Parses files and finds usages in:
  - `JSXIdentifier`
  - `MemberExpression`
  - `CallExpression`

### 3. Import Tracking

- Collects `ImportDeclaration`s
- Marks imported components as used

### 4. Scanner

- Uses `fast-glob` to locate files
- Collects, tracks, consolidates component usage

### 5. File Deletion

- Uses `fs.unlinkSync` with error handling

### 6. Displaying Results

- Colorful console output using `yoctocolors`

### 7. Report Generation

- Writes Markdown (`component-report.md`)
- Converts to PDF (`component-report.pdf`)

---

## 🧱 Core Data Structures

### `Component` Interface

```ts
export interface Component {
  name: string;
  file: string;
  isUsed: boolean;
  usageCount: number;
  usedIn?: string[];
}
```

### `TrackerMaps` Interface

```ts
export interface TrackerMaps {
  componentUsages: Map<string, Set<string>>;
  importedComponents: Map<string, Set<string>>;
}
```

---

## ⚠️ Important Considerations

- **Deletion is permanent** — use version control.
- **Dynamic usage** may not be detected.
- Only parses `.jsx`/`.tsx` (not `.js` or `.ts`).

---

We welcome issues, ideas, and PRs!
