import { chromium } from "@playwright/test";
import { marked } from "marked";
import { readFileSync, writeFileSync } from "node:fs";

import { resolve } from "node:path";
const [, , inputArg, outputArg] = process.argv;
const input = resolve(inputArg);
const output = resolve(outputArg);
const raw = readFileSync(input, "utf-8");

// Frontmatter → page de garde
const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
const body = fm ? raw.slice(fm[0].length) : raw;
const meta: Record<string, string> = {};
if (fm) {
	for (const line of fm[1].split("\n")) {
		const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
		if (m) meta[m[1]] = m[2];
	}
}

const html = `
<style>
  @page { size: A4; margin: 24mm 22mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Liberation Serif', serif; font-size: 12pt; line-height: 1.7; color: #1a1a1a; margin: 0; }
  .cover { padding-top: 70mm; text-align: center; page-break-after: always; }
  .cover h1 { font-size: 30pt; margin: 0 0 8mm; border: none; page-break-before: auto; padding-top: 0; }
  .cover .sub { font-size: 14pt; color: #444; margin-bottom: 20mm; }
  .cover .meta { font-size: 12pt; color: #666; }
  h1 { font-size: 19pt; margin: 0 0 6mm; padding-top: 4mm; page-break-before: always; border-bottom: 2px solid #1a1a1a; padding-bottom: 2mm; }
  h2 { font-size: 14pt; margin: 8mm 0 3mm; }
  h3 { font-size: 12pt; margin: 6mm 0 2mm; }
  p { margin: 0 0 4mm; text-align: justify; }
  h2 { margin-top: 9mm; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 4mm 0 6mm; }
  th, td { border: 1px solid #bbb; padding: 1.6mm 2.5mm; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  code { font-family: 'DejaVu Sans Mono', monospace; font-size: 9pt; background: #f4f4f4; padding: 0 1mm; border-radius: 2px; }
  pre { background: #f7f7f7; border: 1px solid #ddd; padding: 3mm; font-size: 8pt; overflow: hidden; line-height: 1.35; }
  pre code { background: none; padding: 0; }
  ul, ol { margin: 0 0 3.2mm; padding-left: 6mm; }
  li { margin-bottom: 1.2mm; }
  blockquote { margin: 3mm 0; padding: 1mm 4mm; border-left: 3px solid #999; color: #444; }
  tr, li { page-break-inside: avoid; }
  img { max-width: 100%; max-height: 95mm; display: block; margin: 0 auto; border: 1px solid #ddd; }
</style>
<div class="cover">
  <h1>${meta.title ?? "Rapport"}</h1>
  <div class="sub">${meta.subtitle ?? ""}</div>
  <div class="meta">${meta.author ?? ""}<br/>${meta.date ?? ""}</div>
</div>
${marked.parse(body)}
`;

const tmpHtml = `${output}.html`;
writeFileSync(tmpHtml, html);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`);
await page.pdf({
	path: output,
	format: "A4",
	displayHeaderFooter: true,
	headerTemplate: "<span></span>",
	footerTemplate:
		'<div style="width:100%;text-align:center;font-size:8pt;color:#888;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
	margin: { top: "22mm", bottom: "18mm", left: "20mm", right: "20mm" },
});
await browser.close();
const { unlinkSync } = await import("node:fs");
unlinkSync(tmpHtml);
console.log(`PDF écrit : ${output}`);
