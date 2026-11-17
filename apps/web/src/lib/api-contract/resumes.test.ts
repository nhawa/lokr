import { describe, expect, it } from 'vitest';

import {
  resumeListQuerySchema,
  resumeSummarySchema,
  resumeVersionDetailSchema,
  reviewRequestSchema,
  updateContentRequestSchema,
  uploadVersionMetadataSchema,
} from './resumes';

const timestamp = '2026-01-02T03:04:05Z';
const id = 'resume_12345678';
const revision = 'revision_12345678';

describe('resume contracts', () => {
  it('accepts valid pagination and rejects unknown or excessive inputs', () => {
    expect(resumeListQuerySchema.parse({ limit: '25', direction: 'desc' })).toMatchObject({ limit: 25, direction: 'desc' });
    expect(() => resumeListQuerySchema.parse({ limit: 101 })).toThrow();
    expect(() => resumeListQuerySchema.parse({ cursor: 'bad!' })).toThrow();
    expect(() => resumeListQuerySchema.parse({ unknown: 'value' })).toThrow();
  });

  it('validates PDF and DOCX upload metadata', () => {
    expect(uploadVersionMetadataSchema.parse({ filename: 'resume.pdf', mimeType: 'application/pdf', byteSize: 10 })).toBeTruthy();
    expect(uploadVersionMetadataSchema.parse({ filename: 'resume.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', byteSize: 10 })).toBeTruthy();
    expect(() => uploadVersionMetadataSchema.parse({ filename: '../resume.pdf', mimeType: 'application/pdf', byteSize: 10 })).toThrow();
    expect(() => uploadVersionMetadataSchema.parse({ filename: 'resume.docx', mimeType: 'application/pdf', byteSize: 10 })).toThrow();
    expect(() => uploadVersionMetadataSchema.parse({ filename: 'resume.pdf', mimeType: 'application/pdf', byteSize: 0 })).toThrow();
  });

  it('does not include document content in collection summaries', () => {
    expect(resumeSummarySchema.parse({
      id,
      label: 'Primary CV',
      createdAt: timestamp,
      updatedAt: timestamp,
      latestVersion: { id: 'version_12345678', version: 1, extractionStatus: 'ready', reviewStatus: 'needs_review', createdAt: timestamp },
    })).not.toHaveProperty('content');
  });

  it('enforces the complete extraction and review lifecycle matrix', () => {
    const detail = {
      id: 'version_12345678', resumeId: id, version: 1,
      document: { filename: 'resume.pdf', mimeType: 'application/pdf', byteSize: 10, checksum: `sha256:${'a'.repeat(64)}`, uploadedAt: timestamp },
      createdAt: timestamp, updatedAt: timestamp,
    };
    const content = { parsedText: 'Parsed text', editedText: null, source: 'parsed' as const, revision, reviewedAt: null };
    const reviewedContent = { ...content, reviewedAt: timestamp };
    const queued = { ...detail, extractionStatus: 'queued' as const, reviewStatus: 'not_ready' as const, extractionFailureCategory: null, content: null };
    const processing = { ...queued, extractionStatus: 'processing' as const };
    const failed = { ...queued, extractionStatus: 'failed' as const, extractionFailureCategory: 'unreadable_document' as const };
    const ready = { ...queued, extractionStatus: 'ready' as const, reviewStatus: 'needs_review' as const, content };

    expect(resumeVersionDetailSchema.parse(queued)).toBeTruthy();
    expect(resumeVersionDetailSchema.parse(processing)).toBeTruthy();
    expect(resumeVersionDetailSchema.parse(failed)).toBeTruthy();
    expect(resumeVersionDetailSchema.parse(ready)).toBeTruthy();
    expect(resumeVersionDetailSchema.parse({ ...ready, reviewStatus: 'reviewed', content: reviewedContent })).toBeTruthy();

    for (const invalid of [
      { ...queued, content },
      { ...queued, extractionFailureCategory: 'unreadable_document' },
      { ...processing, content },
      { ...processing, extractionFailureCategory: 'unreadable_document' },
      { ...failed, content },
      { ...failed, extractionFailureCategory: null },
      { ...ready, content: null },
      { ...ready, extractionFailureCategory: 'unreadable_document' },
      { ...ready, reviewStatus: 'reviewed' },
      { ...ready, content: reviewedContent },
      { ...queued, reviewStatus: 'needs_review' },
      { ...processing, reviewStatus: 'reviewed' },
      { ...failed, reviewStatus: 'needs_review' },
    ]) {
      expect(() => resumeVersionDetailSchema.parse(invalid)).toThrow();
    }
  });

  it('requires bounded content and review confirmation payloads', () => {
    expect(updateContentRequestSchema.parse({ text: 'Reviewed text', source: 'owner_edit', revision })).toBeTruthy();
    expect(() => updateContentRequestSchema.parse({ text: '', source: 'parsed', revision, extra: true })).toThrow();
    expect(reviewRequestSchema.parse({ revision, confirm: true })).toBeTruthy();
    expect(() => reviewRequestSchema.parse({ revision, confirm: false })).toThrow();
  });
});
