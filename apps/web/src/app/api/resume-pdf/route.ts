import { chromium } from '@playwright/test';
import { renderResumeTemplate, toResumeTemplateData } from '../../../lib/resume-template';

export const runtime = 'nodejs';

type ExportRequest = { markdown?: unknown; filename?: unknown; approved?: unknown };

async function launchPdfBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (chromiumError) {
    try {
      // Chrome is Chromium-based and provides a supported local fallback when
      // Playwright's separately installed browser binary is unavailable.
      return await chromium.launch({ channel: 'chrome', headless: true });
    } catch (chromeError) {
      const chromiumMessage = chromiumError instanceof Error ? chromiumError.message : 'Chromium could not start.';
      const chromeMessage = chromeError instanceof Error ? chromeError.message : 'Chrome could not start.';
      throw new Error(`${chromiumMessage}\nFallback Chrome launch also failed: ${chromeMessage}`);
    }
  }
}

function safeFilename(value: unknown) {
  const name = typeof value === 'string' ? value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') : '';
  return `${name || 'tailored-cv'}.pdf`;
}

export async function POST(request: Request) {
  let body: ExportRequest;
  try { body = await request.json() as ExportRequest; } catch { return Response.json({ error: 'The export request must be valid JSON.' }, { status: 400 }); }
  if (body.approved !== true) return Response.json({ error: 'Approve the CV version before exporting it.' }, { status: 409 });
  if (typeof body.markdown !== 'string' || !body.markdown.trim() || body.markdown.length > 100_000) return Response.json({ error: 'The reviewed CV content is missing or too large.' }, { status: 400 });

  let browser;
  try {
    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><title>CV</title></head><body>${renderResumeTemplate(toResumeTemplateData(body.markdown))}</body></html>`, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
    return new Response(Uint8Array.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${safeFilename(body.filename)}"`, 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('CV PDF export failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'PDF export is unavailable. Install Playwright Chromium, or install Google Chrome for the local fallback.' }, { status: 503 });
  } finally {
    try { await browser?.close(); } catch { /* A crashed browser must not replace the controlled 503 response. */ }
  }
}
