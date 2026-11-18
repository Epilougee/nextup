// export-pdf.js — Export report.html to PDF and verify all pages
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML = path.join(__dirname, 'report.html');
const PDF  = path.join(__dirname, 'NextUp_Report.pdf');
const SS   = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  await page.goto('file:///' + HTML.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // ── Overflow check ──────────────────────────────────────────────
  console.log('=== Overflow Check ===');
  const results = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    return Array.from(pages).map((p, i) => ({
      page: i + 1,
      scrollH: p.scrollHeight,
      offsetH: p.offsetHeight,
      fillPct: Math.round((p.scrollHeight / p.offsetHeight) * 100),
    }));
  });

  let allOk = true;
  for (const r of results) {
    const overflow = r.scrollH > r.offsetH + 2;
    const underfill = r.fillPct < 70;
    const mark = overflow ? '⚠ OVERFLOW' : (underfill ? '⚠ UNDERFILL' : '✓ OK');
    if (overflow || underfill) allOk = false;
    console.log(`Page ${r.page}: scrollH=${r.scrollH}, offsetH=${r.offsetH}, fill=${r.fillPct}% ${mark}`);
  }
  if (!allOk) console.log('\nWARNING: Some pages need adjustment.\n');
  else console.log('\nAll pages OK.\n');

  // ── Export PDF ───────────────────────────────────────────────────
  await page.pdf({
    path: PDF,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  console.log('PDF exported:', PDF);

  // ── Render visual verify PNGs for ALL 10 pages ───────────────────
  for (const r of results) {
    // Navigate to that page section and screenshot it
    await page.evaluate((idx) => {
      document.querySelectorAll('.page')[idx].scrollIntoView();
    }, r.page - 1);
    await page.waitForTimeout(200);
    const el = await page.$$(`.page`);
    if (el[r.page - 1]) {
      await el[r.page - 1].screenshot({
        path: path.join(SS, `verify-p${String(r.page).padStart(2,'0')}.png`),
      });
      console.log(`Visual check: verify-p${String(r.page).padStart(2,'0')}.png`);
    }
  }

  // PDF file size
  const stat = fs.statSync(PDF);
  console.log(`\nPDF file size: ${(stat.size / 1024).toFixed(1)} KB`);
  console.log(`Page count: ${results.length} .page sections in report.html`);

  await ctx.close();
  await browser.close();
})();
