import { chromium } from '@playwright/test';
import { z } from 'zod';

import { MAX_DISPLAY_FILENAME_CHARACTERS, MAX_RESUME_CONTENT_CHARACTERS } from '../../../lib/api-contract/common';
import { problem, problemResponse } from '../../../lib/api-contract/problem';
import { renderResumeTemplate, toResumeTemplateData } from '../../../lib/resume-template';

export const runtime = 'nodejs';

const exportRequestSchema = z.object({
  markdown: z.string().trim().min(1).max(MAX_RESUME_CONTENT_CHARACTERS),
  filename: z.string().max(MAX_DISPLAY_FILENAME_CHARACTERS).optional(),
}).strict();

async function launchPdfBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return chromium.launch({ channel: 'chrome', headless: true });
  }
}

function safeFilename(value: unknown): string {
  const input = typeof value === 'string' ? value.slice(0, MAX_DISPLAY_FILENAME_CHARACTERS) : '';
  const name = input.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '');
  return `${name || 'tailored-cv'}.pdf`;
}

function requestId(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request): Promise<Response> {
  const id = requestId();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return problemResponse(problem('export_request_invalid', id));
  }

  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problemResponse(problem('export_request_invalid', id));
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><title>CV</title></head><body>${renderResumeTemplate(toResumeTemplateData(parsed.data.markdown))}</body></html>`, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
    return new Response(Uint8Array.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename(parsed.data.filename)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    console.error('CV PDF export failed: browser_unavailable');
    return problemResponse(problem('export_unavailable', id));
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Cleanup failures must not replace the primary response.
      }
    }
  }
}
