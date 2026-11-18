// capture.js — NextUp report screenshot capture
// 1280x800 @2x deviceScaleFactor, no browser chrome, real data visible

const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3001';
const OUT = path.join(__dirname, 'screenshots');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function capture(page, filename, opts = {}) {
  const { clip, waitMs = 2500 } = opts;
  await wait(waitMs);
  const shotOpts = { path: path.join(OUT, filename) };
  if (clip) shotOpts.clip = clip;
  await page.screenshot(shotOpts);
  console.log('  ✓', filename);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── STUDENT SESSION ──────────────────────────────────────────────
  const ctx1 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await ctx1.newPage();

  // 01 — Login page
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await wait(1500);
  await capture(page, '01-login.png', { waitMs: 0 });

  // Log in as student
  await page.fill('input[type="email"]', 'student1@demo.com');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/', { timeout: 8000 });
  await wait(2500);

  // 02 — Student home (Get Docs tab, services visible)
  await capture(page, '02-student-home.png', { waitMs: 0 });

  // 03 — Counter Desks tab
  await page.click('text=Counter Desks');
  await wait(2000);
  await capture(page, '03-counter-desks.png', { waitMs: 0 });

  // 04 — My Token page (Aarav has ACC-005)
  await page.goto(BASE + '/my-token', { waitUntil: 'domcontentloaded' });
  await wait(3000);
  await capture(page, '04-my-token.png', { waitMs: 0 });

  // 05 — My Docs
  await page.goto(BASE + '/?tab=my-docs', { waitUntil: 'domcontentloaded' });
  await wait(2500);
  // Click My Docs tab
  try { await page.click('text=My Docs'); await wait(2000); } catch(e) {}
  await capture(page, '05-my-docs.png', { waitMs: 0 });

  await ctx1.close();

  // ── PUBLIC DISPLAY ───────────────────────────────────────────────
  const ctx2 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const pg2 = await ctx2.newPage();
  await pg2.goto(BASE + '/display', { waitUntil: 'domcontentloaded' });
  await wait(3000);
  await capture(pg2, '06-display-board.png', { waitMs: 0 });
  await ctx2.close();

  // ── ADMIN SESSION ────────────────────────────────────────────────
  const ctx3 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const pg3 = await ctx3.newPage();

  // Login as admin
  await pg3.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await wait(1000);
  await pg3.fill('input[type="email"]', 'admin@demo.com');
  await pg3.fill('input[type="password"]', 'demo123');
  await pg3.click('button[type="submit"]');
  await pg3.waitForURL('**/admin/**', { timeout: 8000 });
  await wait(2500);

  // 07 — Admin Queue Console
  await capture(pg3, '07-admin-queue.png', { waitMs: 0 });

  // 08 — Analytics
  await pg3.goto(BASE + '/admin/analytics', { waitUntil: 'domcontentloaded' });
  await wait(3500);
  await capture(pg3, '08-admin-analytics.png', { waitMs: 0 });

  // 09 — Services management
  await pg3.goto(BASE + '/admin/services', { waitUntil: 'domcontentloaded' });
  await wait(2500);
  await capture(pg3, '09-admin-services.png', { waitMs: 0 });

  await ctx3.close();

  // ── HISTORY ─────────────────────────────────────────────────────
  const ctx4 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const pg4 = await ctx4.newPage();
  await pg4.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await wait(1000);
  await pg4.fill('input[type="email"]', 'student1@demo.com');
  await pg4.fill('input[type="password"]', 'demo123');
  await pg4.click('button[type="submit"]');
  await pg4.waitForURL('**/', { timeout: 8000 });
  await pg4.goto(BASE + '/history', { waitUntil: 'domcontentloaded' });
  await wait(2500);
  await capture(pg4, '10-history.png', { waitMs: 0 });
  await ctx4.close();

  await browser.close();
  console.log('\nAll screenshots done.');
})();
