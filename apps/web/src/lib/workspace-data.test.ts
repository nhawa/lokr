import { describe, expect, it } from 'vitest';
import { addJob, counts, createSample, filteredApplications, reviewDocument, snapshotAt, tasks, updateStage, validateJob, validateUpload } from './workspace-data';

describe('sample data and local workspace actions', () => {
  it('reconciles pipeline, CV references, tasks and chronological order', () => {
    const d = createSample();
    expect(Object.values(counts(d)).reduce((sum, n) => sum + n, 0)).toBe(d.applications.length);
    expect(counts(d)).toEqual({ saved: 3, applied: 3, screening: 2, interview: 2, offer: 0, rejected: 1, withdrawn: 1 });
    expect(tasks(d)).toHaveLength(3);
    expect(filteredApplications(d).slice(0, 5).map(a => a.id)).toEqual(['A01', 'A02', 'A03', 'A04', 'A05']);
    expect(d.applications.every(a => new Date(a.updatedAt) >= new Date(d.jobs.find(j => j.id === a.jobId)!.createdAt))).toBe(true);
  });
  it('filters, sorts, and represents zero results honestly', () => {
    const d = createSample();
    expect(filteredApplications(d, 'infrastructure')[0].id).toBe('A05');
    expect(filteredApplications(d, '', 'saved')).toHaveLength(3);
    expect(filteredApplications(d, '', 'offer')).toEqual([]);
    expect(filteredApplications(d, '', '', 'oldest')[0].id).toBe('A12');
  });
  it('creates a linked saved application and activity atomically without mutating the original', () => {
    const d = createSample();
    const next = addJob(d, { title: 'API Engineer', company: 'Integration Room', description: 'Design internal service APIs.', sourceUrl: '' }, snapshotAt);
    expect(next.jobs).toHaveLength(13); expect(next.applications).toHaveLength(13);
    expect(counts(next).saved).toBe(4); expect(next.events[0].target).toBe('#/jobs/J13');
    expect(d.jobs).toHaveLength(12);
  });
  it('rejects incomplete data and executable URLs', () => {
    expect(validateJob({ title: ' ', company: 'A', description: 'B', sourceUrl: '' })).not.toBe('');
    expect(() => addJob(createSample(), { title: 'A', company: 'B', description: 'C', sourceUrl: 'javascript:alert(1)' }, snapshotAt)).toThrow();
    expect(validateJob({ title: 'A', company: 'B', description: 'C', sourceUrl: 'https://example.com/job' })).toBe('');
  });
  it('reconciles a stage change and does not log a no-op', () => {
    const d = createSample(), changed = updateStage(d, 'A01', 'applied', snapshotAt);
    expect(counts(changed).saved).toBe(2); expect(counts(changed).applied).toBe(4);
    expect(changed.applications).toHaveLength(12); expect(changed.events).toHaveLength(4);
    expect(updateStage(changed, 'A01', 'applied', snapshotAt)).toBe(changed);
    expect(() => updateStage(d, 'missing', 'saved', snapshotAt)).toThrow();
  });
  it('removes only the reviewed task and keeps the source text intact', () => {
    const d = createSample(), changed = reviewDocument(d, 'CV02', snapshotAt);
    expect(tasks(changed)).toHaveLength(2);
    expect(changed.resumes[1].text).toBe(d.resumes[1].text);
    expect(reviewDocument(changed, 'CV02', snapshotAt)).toBe(changed);
  });
  it('rejects empty, oversized, disguised and mismatched uploads', () => {
    const pdf = new TextEncoder().encode('%PDF-1.7');
    expect(validateUpload('cv.pdf', 200, pdf)).toBe('');
    expect(validateUpload('cv.docx', 200, new Uint8Array([80,75,3,4]))).toBe('');
    expect(validateUpload('cv.pdf', 0, pdf)).not.toBe('');
    expect(validateUpload('cv.pdf', 11 * 1024 * 1024, pdf)).not.toBe('');
    expect(validateUpload('cv.pdf', 200, new TextEncoder().encode('<html>'))).not.toBe('');
    expect(validateUpload('cv.exe', 200, pdf)).not.toBe('');
  });
});
