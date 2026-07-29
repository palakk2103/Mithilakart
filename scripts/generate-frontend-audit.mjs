#!/usr/bin/env node
/**
 * Mithilakart Frontend Audit Generator
 * Scans all frontend source files and generates enterprise audit documentation.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const OUT = path.join(ROOT, 'docs', 'frontend-audit');

const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json']);
const SKIP_DIRS = new Set(['node_modules', 'dev-dist', '.git']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function extractImports(content) {
  const imports = [];
  const re = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) imports.push(m[1]);
  return imports;
}

function extractExports(content) {
  const exports = [];
  const re = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g;
  let m;
  while ((m = re.exec(content))) exports.push(m[1]);
  if (/export\s+default/.test(content)) exports.push('default');
  return [...new Set(exports)];
}

function extractRoutes(content) {
  const routes = [];
  const re = /<Route\s+[^>]*path=["']([^"']*)["'][^>]*(?:element=\{<(\w+)[^}]*\}|element=\{<Navigate[^}]*\})/g;
  let m;
  while ((m = re.exec(content))) routes.push({ path: m[1], component: m[2] || 'Navigate' });
  const re2 = /path:\s*['"]([^'"]+)['"]/g;
  while ((m = re2.exec(content))) routes.push({ path: m[1], component: 'object-route' });
  return routes;
}

function extractButtons(content) {
  const buttons = [];
  const re = /<button[^>]*>([\s\S]*?)<\/button>/gi;
  let m;
  while ((m = re.exec(content))) {
    const raw = m[0];
    const label = m[1].replace(/<[^>]+>/g, '').trim().slice(0, 80);
    const onClick = raw.match(/onClick=\{([^}]+)\}/)?.[1] || '';
    const type = raw.match(/type=["'](\w+)["']/)?.[1] || 'button';
    buttons.push({ label: label || '(icon-only)', onClick, type });
  }
  return buttons;
}

function extractFormFields(content) {
  const fields = [];
  const inputRe = /<(?:input|textarea|select)[^>]*>/gi;
  let m;
  while ((m = inputRe.exec(content))) {
    const tag = m[0];
    const name = tag.match(/name=["']([^"']+)["']/)?.[1] || tag.match(/\{\.\.\.register\(['"]([^'"]+)['"]\)/)?.[1] || 'unnamed';
    const type = tag.match(/type=["']([^"']+)["']/)?.[1] || (tag.startsWith('<select') ? 'select' : tag.startsWith('<textarea') ? 'textarea' : 'text');
    const required = /required/.test(tag);
    const placeholder = tag.match(/placeholder=["']([^"']+)["']/)?.[1] || '';
    fields.push({ name, type, required, placeholder });
  }
  return fields;
}

function extractStateHooks(content) {
  const hooks = [];
  const re = /useState\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(content))) hooks.push(`useState(${m[1].slice(0, 40)})`);
  const re2 = /useEffect\(/g;
  let count = 0;
  while (re2.exec(content)) count++;
  if (count) hooks.push(`useEffect x${count}`);
  if (/useSelector/.test(content)) hooks.push('useSelector');
  if (/useDispatch/.test(content)) hooks.push('useDispatch');
  if (/useAccountStore/.test(content)) hooks.push('useAccountStore');
  if (/useVendorStore/.test(content)) hooks.push('useVendorStore');
  if (/useDeliveryStore/.test(content)) hooks.push('useDeliveryStore');
  if (/useTranslation/.test(content)) hooks.push('useTranslation');
  if (/useForm/.test(content)) hooks.push('useForm');
  if (/useNavigate/.test(content)) hooks.push('useNavigate');
  if (/useLocation/.test(content)) hooks.push('useLocation');
  if (/useParams/.test(content)) hooks.push('useParams');
  return hooks;
}

function extractTodos(content, filePath) {
  const todos = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
      todos.push({ line: i + 1, text: line.trim() });
    }
  });
  return todos;
}

function extractApiCalls(content) {
  const apis = [];
  const patterns = [
    /axios\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]/g,
    /fetch\(['"`]([^'"`]+)['"`]/g,
    /axiosInstance\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]/g,
    /\/api\/[a-zA-Z0-9/_-]+/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content))) {
      apis.push(m[2] || m[1] || m[0]);
    }
  }
  return [...new Set(apis)];
}

function extractLocalStorage(content) {
  const keys = [];
  const re = /localStorage\.(getItem|setItem|removeItem)\(['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) keys.push(m[2]);
  return [...new Set(keys)];
}

function extractHardcodedStrings(content) {
  const patterns = [];
  if (/dummy|mock|MOCK_|hardcoded|fake|sample/i.test(content)) patterns.push('contains mock/dummy references');
  if (/https?:\/\/[^\s'"]+/.test(content)) {
    const urls = content.match(/https?:\/\/[^\s'"]+/g) || [];
    urls.slice(0, 10).forEach(u => patterns.push(`URL: ${u}`));
  }
  return patterns;
}

function isComponentFile(filePath) {
  return /\.(jsx|tsx)$/.test(filePath) || /components?\//i.test(filePath);
}

function isPageFile(filePath) {
  return /pages?\//i.test(filePath) && /\.(jsx|tsx)$/.test(filePath);
}

function isRouteFile(filePath) {
  return /routes?\//i.test(filePath);
}

function analyzeFile(filePath) {
  const content = readSafe(filePath);
  const ext = path.extname(filePath);
  return {
    path: rel(filePath),
    ext,
    lines: content.split('\n').length,
    imports: extractImports(content),
    exports: extractExports(content),
    routes: extractRoutes(content),
    buttons: extractButtons(content),
    formFields: extractFormFields(content),
    hooks: extractStateHooks(content),
    todos: extractTodos(content, filePath),
    apis: extractApiCalls(content),
    localStorage: extractLocalStorage(content),
    hardcoded: extractHardcodedStrings(content),
    hasModal: /Modal|Dialog|Drawer|ConfirmModal|ConfirmDialog/i.test(content),
    hasTable: /<table|DataTable/i.test(content),
    hasChart: /recharts|Chart|BarChart|LineChart|PieChart/i.test(content),
    hasToast: /toast\.|react-hot-toast|Toaster/i.test(content),
    hasForm: /useForm|onSubmit|handleSubmit|<form/i.test(content),
    content: content.slice(0, 50000),
  };
}

function fileAuditMd(a) {
  let md = `# File Audit: ${a.path}\n\n`;
  md += `| Property | Value |\n|----------|-------|\n`;
  md += `| Lines | ${a.lines} |\n`;
  md += `| Extension | ${a.ext} |\n`;
  md += `| Has Form | ${a.hasForm} |\n`;
  md += `| Has Modal/Dialog | ${a.hasModal} |\n`;
  md += `| Has Table | ${a.hasTable} |\n`;
  md += `| Has Chart | ${a.hasChart} |\n`;
  md += `| Has Toast | ${a.hasToast} |\n\n`;

  if (a.exports.length) {
    md += `## Exports\n\n${a.exports.map(e => `- \`${e}\``).join('\n')}\n\n`;
  }
  if (a.imports.length) {
    md += `## Imports (${a.imports.length})\n\n${a.imports.map(i => `- \`${i}\``).join('\n')}\n\n`;
  }
  if (a.hooks.length) {
    md += `## Hooks / State\n\n${a.hooks.map(h => `- ${h}`).join('\n')}\n\n`;
  }
  if (a.routes.length) {
    md += `## Routes Defined\n\n| Path | Component |\n|------|----------|\n`;
    a.routes.forEach(r => { md += `| \`${r.path}\` | ${r.component} |\n`; });
    md += '\n';
  }
  if (a.formFields.length) {
    md += `## Form Fields\n\n| Name | Type | Required | Placeholder |\n|------|------|----------|-------------|\n`;
    a.formFields.forEach(f => {
      md += `| ${f.name} | ${f.type} | ${f.required} | ${f.placeholder} |\n`;
    });
    md += '\n';
  }
  if (a.buttons.length) {
    md += `## Buttons (${a.buttons.length})\n\n`;
    a.buttons.forEach((b, i) => {
      md += `### Button ${i + 1}\n- **Label:** ${b.label}\n- **Type:** ${b.type}\n- **onClick:** \`${b.onClick}\`\n\n`;
    });
  }
  if (a.apis.length) {
    md += `## API References\n\n${a.apis.map(api => `- \`${api}\``).join('\n')}\n\n`;
  }
  if (a.localStorage.length) {
    md += `## localStorage Keys\n\n${a.localStorage.map(k => `- \`${k}\``).join('\n')}\n\n`;
  }
  if (a.todos.length) {
    md += `## TODOs / FIXMEs\n\n${a.todos.map(t => `- L${t.line}: ${t.text}`).join('\n')}\n\n`;
  }
  if (a.hardcoded.length) {
    md += `## Hardcoded / Mock Indicators\n\n${a.hardcoded.map(h => `- ${h}`).join('\n')}\n\n`;
  }
  md += `## Backend Dependency Inference\n\n`;
  if (a.apis.length) md += `This file references ${a.apis.length} API endpoint(s). See API_Requirements.md.\n`;
  else if (a.hasForm) md += `Contains forms — requires corresponding POST/PUT API endpoints with validation.\n`;
  else if (a.hasTable) md += `Contains data tables — requires paginated list API with filters/sort.\n`;
  else md += `Primarily presentational or uses local/mock state. Verify at integration time.\n`;
  return md;
}

// Main
console.log('Generating frontend audit...');
ensureDir(OUT);

const allFiles = walk(FRONTEND_SRC);
const codeFiles = allFiles.filter(f => CODE_EXT.has(path.extname(f)));
const analyses = codeFiles.map(analyzeFile);

// Per-file audits
const dirs = {
  files: path.join(OUT, 'files'),
  routes: path.join(OUT, 'routes'),
  pages: path.join(OUT, 'pages'),
  components: path.join(OUT, 'components'),
  stores: path.join(OUT, 'stores'),
  services: path.join(OUT, 'services'),
};

Object.values(dirs).forEach(ensureDir);

for (const a of analyses) {
  const safeName = a.path.replace(/[<>:"|?*]/g, '_').replace(/\//g, '__');
  write(path.join(dirs.files, `${safeName}.md`), fileAuditMd(a));

  if (isRouteFile(a.path)) write(path.join(dirs.routes, `${safeName}.md`), fileAuditMd(a));
  if (isPageFile(a.path)) write(path.join(dirs.pages, `${safeName}.md`), fileAuditMd(a));
  if (isComponentFile(a.path)) write(path.join(dirs.components, `${safeName}.md`), fileAuditMd(a));
  if (a.path.includes('store/')) write(path.join(dirs.stores, `${safeName}.md`), fileAuditMd(a));
  if (a.path.includes('services/') || a.path.includes('authApi')) write(path.join(dirs.services, `${safeName}.md`), fileAuditMd(a));
}

// Aggregate data
const allRoutes = analyses.flatMap(a => a.routes.map(r => ({ ...r, file: a.path })));
const allTodos = analyses.flatMap(a => a.todos.map(t => ({ ...t, file: a.path })));
const allButtons = analyses.flatMap(a => a.buttons.map((b, i) => ({ ...b, file: a.path, index: i })));
const allForms = analyses.filter(a => a.formFields.length > 0 || a.hasForm);
const allModals = analyses.filter(a => a.hasModal);
const allTables = analyses.filter(a => a.hasTable);
const allApis = [...new Set(analyses.flatMap(a => a.apis))];
const allLocalStorage = [...new Set(analyses.flatMap(a => a.localStorage))];

// Write index
write(path.join(OUT, 'INDEX.md'), `# Frontend Audit Index

Generated: ${new Date().toISOString()}

## Statistics
- Total files scanned: ${allFiles.length}
- Code files analyzed: ${codeFiles.length}
- Per-file audit documents: ${analyses.length}
- Routes extracted: ${allRoutes.length}
- TODO/FIXME items: ${allTodos.length}
- Files with forms: ${allForms.length}
- Files with modals: ${allModals.length}
- Files with tables: ${allTables.length}
- Unique API references: ${allApis.length}
- localStorage keys: ${allLocalStorage.length}

## Master Documents
See 01_Project_Overview.md through 30_Final_Master_Audit.md

## Subdirectories
- files/ — every analyzed source file
- routes/ — route definition files
- pages/ — page components
- components/ — reusable components
- stores/ — state management
- services/ — API service layers
`);

// Export aggregates for master docs
const aggregate = {
  allFiles: allFiles.map(rel),
  codeFiles: codeFiles.map(rel),
  analyses,
  allRoutes,
  allTodos,
  allButtons,
  allForms,
  allModals,
  allTables,
  allApis,
  allLocalStorage,
};
write(path.join(OUT, '_aggregate.json'), JSON.stringify(aggregate, null, 2));
console.log(`Done. ${analyses.length} file audits written to ${OUT}`);
