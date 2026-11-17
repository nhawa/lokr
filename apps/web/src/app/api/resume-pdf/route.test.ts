import { chromium } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { MAX_DISPLAY_FILENAME_CHARACTERS } from '../../../lib/api-contract/common';
import { POST } from './route';

function request(body: string): Request {
  return new Request('http://localhost/api/resume-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
}

describe('POST /api/resume-pdf', () => {
  it('returns an export-specific problem for malformed JSON', async () => {
    const response = await POST(request('{'));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(body).toMatchObject({ code: 'export_request_invalid', title: 'Invalid export request' });
  });

  it('renders without client-provided approval and rejects unknown properties', async () => {
    const launchSpy = vi.spyOn(chromium, 'launch').mockRejectedValue(new Error('unavailable'));
    try {
      const response = await POST(request(JSON.stringify({ markdown: 'CV' })));
      expect(response.status).toBe(503);
      expect((await response.json()).code).toBe('export_unavailable');

      const invalidResponse = await POST(request(JSON.stringify({ markdown: 'CV', approved: true })));
      expect(invalidResponse.status).toBe(400);
      expect((await invalidResponse.json()).code).toBe('export_request_invalid');
    } finally {
      launchSpy.mockRestore();
    }
  });

  it('rejects oversized filenames before launching a browser', async () => {
    const launchSpy = vi.spyOn(chromium, 'launch');
    try {
      const response = await POST(request(JSON.stringify({ markdown: 'CV', filename: 'a'.repeat(MAX_DISPLAY_FILENAME_CHARACTERS + 1) })));
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain('application/problem+json');
      expect(body).toMatchObject({ code: 'export_request_invalid', title: 'Invalid export request' });
      expect(launchSpy).not.toHaveBeenCalled();
    } finally {
      launchSpy.mockRestore();
    }
  });

  it('returns export-specific problems without browser failure details', async () => {
    const launchSpy = vi.spyOn(chromium, 'launch').mockRejectedValue(new Error('private browser launch detail'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const response = await POST(request(JSON.stringify({ markdown: 'CV' })));
      const body = await response.json();
      expect(response.status).toBe(503);
      expect(response.headers.get('content-type')).toContain('application/problem+json');
      expect(body).toMatchObject({ code: 'export_unavailable', title: 'PDF export unavailable' });
      expect(JSON.stringify(body)).not.toContain('private browser launch detail');
    } finally {
      launchSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('ignores synchronous cleanup failures after a successful export', async () => {
    const close = vi.fn(() => { throw new Error('close failed'); });
    const page = { setContent: vi.fn(), pdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])) };
    const launchSpy = vi.spyOn(chromium, 'launch').mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page), close } as never);
    try {
      const response = await POST(request(JSON.stringify({ markdown: 'CV', filename: 'tailored-cv' })));
      expect(response.status).toBe(200);
      expect(response.headers.get('content-disposition')).toBe('attachment; filename="tailored-cv.pdf"');
      expect(close).toHaveBeenCalledOnce();
    } finally {
      launchSpy.mockRestore();
    }
  });
});
