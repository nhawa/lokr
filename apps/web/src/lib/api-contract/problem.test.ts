import { describe, expect, it } from 'vitest';

import { problem, problemDetailsSchema, validationProblem } from './problem';

describe('problem details contract', () => {
  it('creates a valid standardized problem', () => {
    const value = problem('not_found', 'request_12345678');
    expect(problemDetailsSchema.parse(value)).toMatchObject({
      type: 'https://lokr.local/problems/not_found',
      title: 'Not found',
      status: 404,
      code: 'not_found',
      requestId: 'request_12345678',
    });
  });

  it('keeps validation issues limited to safe field metadata', () => {
    const value = validationProblem('request_12345678', [{ path: 'markdown', code: 'too_small', message: 'Required.' }]);
    expect(value).toEqual(expect.objectContaining({ code: 'validation_failed', issues: [{ path: 'markdown', code: 'too_small', message: 'Required.' }] }));
    expect(JSON.stringify(value)).not.toContain('resume text');
  });

  it('maps every supported code to a client error status', () => {
    for (const code of ['malformed_request', 'export_request_invalid', 'export_unavailable', 'unsupported_media_type', 'invalid_file_signature', 'upload_too_large', 'not_found', 'conflict', 'extraction_unavailable', 'extraction_failed', 'internal_error'] as const) {
      expect(problem(code, 'request_12345678').status).toBeGreaterThanOrEqual(400);
    }
  });

  it('defines export-specific safe problems', () => {
    const value = problem('export_unavailable', 'request_12345678');
    expect(value).toMatchObject({
      type: 'https://lokr.local/problems/export_unavailable',
      title: 'PDF export unavailable',
      status: 503,
      detail: 'PDF export is temporarily unavailable.',
    });
    expect(() => problemDetailsSchema.parse({ ...value, code: 'unknown' })).toThrow();
  });
});
