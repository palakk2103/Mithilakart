const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.resolve(__dirname, '../../docs');
const INPUT_MD = path.join(DOCS_DIR, 'MITHILAKART_COMPLETE_SYSTEM_AND_ORDER_CYCLE_DOCUMENTATION.md');
const HTML_OUTPUT = path.join(DOCS_DIR, 'MITHILAKART_COMPLETE_SYSTEM_AND_ORDER_CYCLE_DOCUMENTATION.html');
const PDF_OUTPUT = path.join(DOCS_DIR, 'MITHILAKART_COMPLETE_SYSTEM_AND_ORDER_CYCLE_DOCUMENTATION.pdf');

console.log('=== Step 1: Converting Markdown to HTML via marked ===');
// Use npx marked to generate the base HTML body
execSync(`npx marked -i "${INPUT_MD}" -o "${path.join(DOCS_DIR, 'body_temp.html')}" --gfm`, {
  stdio: 'inherit',
  cwd: DOCS_DIR,
});

let bodyContent = fs.readFileSync(path.join(DOCS_DIR, 'body_temp.html'), 'utf8');

// Convert marked's <pre><code class="language-mermaid"> into <div class="mermaid">
bodyContent = bodyContent.replace(
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
  (match, code) => {
    // Unescape HTML entities that marked might have escaped
    const unescaped = code
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    return `<div class="mermaid-container"><div class="mermaid">${unescaped}</div></div>`;
  }
);

console.log('=== Step 2: Injecting Corporate Executive Styling & Mermaid Theme ===');
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mithilakart — Architecture, Business Flow & Order Lifecycle Specification</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      themeVariables: {
        primaryColor: '#e0e7ff',
        primaryTextColor: '#1e1b4b',
        primaryBorderColor: '#6366f1',
        lineColor: '#4f46e5',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#ffffff'
      },
      flowchart: { curve: 'basis' }
    });
  </script>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
      font-size: 12.5px;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Executive Cover Banner */
    .doc-header-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
      color: #ffffff;
      padding: 24px 28px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 14px rgba(30, 27, 75, 0.15);
    }

    .doc-header-banner h1 {
      color: #ffffff;
      margin: 0 0 10px 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      border-bottom: none;
      padding: 0;
    }

    .doc-header-subtitle {
      color: #c7d2fe;
      font-size: 13.5px;
      font-weight: 500;
      margin-bottom: 14px;
    }

    .badge-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-green { background: #10b981; color: #ffffff; }
    .badge-blue { background: #3b82f6; color: #ffffff; }
    .badge-purple { background: #8b5cf6; color: #ffffff; }
    .badge-amber { background: #f59e0b; color: #ffffff; }

    /* Typography */
    h1 {
      color: #1e1b4b;
      font-size: 20px;
      font-weight: 800;
      margin-top: 28px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      page-break-after: avoid;
    }

    h2 {
      color: #1e293b;
      font-size: 16px;
      font-weight: 700;
      margin-top: 24px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      page-break-after: avoid;
    }

    h3 {
      color: #334155;
      font-size: 14px;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    p {
      margin: 8px 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 11px;
      page-break-inside: avoid;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    th {
      background: #1e293b;
      color: #ffffff;
      padding: 7px 9px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #334155;
    }

    td {
      border: 1px solid #e2e8f0;
      padding: 6px 9px;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Code & Blocks */
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px 14px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      line-height: 1.45;
      page-break-inside: avoid;
      border: 1px solid #1e293b;
      margin: 12px 0;
    }

    code {
      background: #f1f5f9;
      color: #1e293b;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    blockquote {
      border-left: 4px solid #6366f1;
      background: #f5f3ff;
      padding: 8px 14px;
      margin: 12px 0;
      border-radius: 0 8px 8px 0;
      color: #3730a3;
      page-break-inside: avoid;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }

    /* Mermaid diagrams container */
    .mermaid-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      margin: 16px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .mermaid {
      display: flex;
      justify-content: center;
    }

    /* Lists */
    ul, ol {
      margin: 8px 0;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Links */
    a {
      color: #4f46e5;
      text-decoration: none;
    }

    /* Print page numbering and footer */
    .page-footer {
      font-size: 9px;
      color: #94a3b8;
      text-align: right;
      margin-top: 20px;
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <div class="doc-header-banner">
    <h1>MITHILAKART — SYSTEM SPECIFICATION</h1>
    <div class="doc-header-subtitle">Intelligent Fulfillment, Single-Seller Cart Routing &amp; Automatic Quick-to-Standard Downgrade</div>
    <div class="badge-bar">
      <span class="badge badge-green">&#10004; PRODUCTION READY</span>
      <span class="badge badge-blue">CR-002 CERTIFIED</span>
      <span class="badge badge-purple">100% CODE-AUDITED</span>
      <span class="badge badge-amber">VERSION 2.0.0</span>
    </div>
  </div>

  ${bodyContent}

  <div class="page-footer">
    Mithilakart Technical Documentation &bull; Document ID: MK-CR002-E2E-CERT &bull; All Rights Reserved
  </div>

</body>
</html>`;

fs.writeFileSync(HTML_OUTPUT, fullHtml, 'utf8');
console.log('Saved formatted HTML to:', HTML_OUTPUT);

// Clean up temporary body file
try { fs.unlinkSync(path.join(DOCS_DIR, 'body_temp.html')); } catch {}

console.log('=== Step 3: Launching Headless Chrome to Generate PDF ===');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const { spawnSync } = require('child_process');

const args = [
  '--headless',
  '--disable-gpu',
  '--run-all-compositor-stages-before-draw',
  '--virtual-time-budget=4000',
  '--no-pdf-header-footer',
  `--print-to-pdf=${PDF_OUTPUT}`,
  HTML_OUTPUT,
];

const res = spawnSync(chromePath, args, { stdio: 'inherit' });
if (res.error) {
  console.error('Chrome spawn error:', res.error);
}

if (fs.existsSync(PDF_OUTPUT)) {
  const stats = fs.statSync(PDF_OUTPUT);
  console.log('=== SUCCESS: PDF Generated Successfully! ===');
  console.log('PDF Path:', PDF_OUTPUT);
  console.log('File Size:', (stats.size / 1024).toFixed(2), 'KB');
} else {
  console.error('ERROR: PDF generation failed — file was not created.');
  process.exit(1);
}
