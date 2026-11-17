// Representative records only. All companies, documents and events below are illustrative.
export const stages = [
  ['saved', 'Saved'], ['applied', 'Applied'], ['screening', 'Screening'],
  ['interview', 'Interview'], ['offer', 'Offer'], ['rejected', 'Rejected'], ['withdrawn', 'Withdrawn'],
] as const;
export type Stage = typeof stages[number][0];
export type Job = { id: string; title: string; company: string; description: string; sourceUrl: string; createdAt: string; notes: string };
export type Application = { id: string; jobId: string; resumeVersionId: string | null; status: Stage; updatedAt: string; notes: string; interviewNote: string };
export type Resume = { id: string; name: string; reviewState: 'pending' | 'reviewed' | 'unparsed'; text: string; createdAt: string; sourceResumeId?: string; jobId?: string; file?: File };
export type Activity = { id: string; text: string; target: string; occurredAt: string };
export type Reminder = { id: string; applicationId: string; text: string; scheduledAt?: string };
export type WorkspaceData = { jobs: Job[]; applications: Application[]; resumes: Resume[]; drafts: Resume[]; events: Activity[]; reminders: Reminder[] };
export const snapshotAt = '2026-11-15T09:15:00+08:00';
const rows: [string, string, Stage, string, string | null][] = [
  ['Backend Engineer', 'Northline', 'saved', '2026-11-15T09:10:00+08:00', null],
  ['Platform Engineer', 'System Foundry', 'saved', '2026-11-15T08:50:00+08:00', 'CV01'],
  ['AI Tooling Engineer', 'Beacon Data', 'saved', '2026-11-14T16:20:00+08:00', 'CV02'],
  ['Backend Developer', 'Span Digital', 'applied', '2026-11-14T14:00:00+08:00', 'CV01'],
  ['Platform Engineer', 'Infrastructure Loop', 'interview', '2026-11-14T10:15:00+08:00', 'CV01'],
  ['Backend Engineer', 'Current Apps', 'interview', '2026-11-13T15:30:00+08:00', 'CV01'],
  ['API Engineer', 'Compute Tone', 'screening', '2026-11-13T11:00:00+08:00', 'CV01'],
  ['Platform Developer', 'Pattern Works', 'screening', '2026-11-12T16:00:00+08:00', 'CV01'],
  ['Backend Developer', 'Axis Digital', 'applied', '2026-11-12T10:00:00+08:00', 'CV01'],
  ['Integration Engineer', 'Stack Systems', 'applied', '2026-11-11T14:00:00+08:00', 'CV01'],
  ['Backend Engineer', 'Coreline', 'rejected', '2026-11-11T09:00:00+08:00', 'CV01'],
  ['Platform Engineer', 'Process Room', 'withdrawn', '2026-11-10T15:00:00+08:00', 'CV01'],
];
const sourceText = '# CV source\n\n## Review note\n\nIllustrative document for reviewing a CV structure. Summary, experience, and skills have not been filled with the workspace owner’s qualifications.';
export function createSample(): WorkspaceData {
  return {
    jobs: rows.map(([title, company], i) => ({ id: `J${String(i + 1).padStart(2, '0')}`, title, company, sourceUrl: '', createdAt: '2026-11-10T09:00:00+08:00', notes: '', description: i === 0 ? '' : title.includes('Platform') ? 'Build internal platforms, maintain deployment flows, and improve service observability. Focus on system reliability and developer experience.' : title.includes('AI') ? 'Build model evaluation tools, AI API integrations, and document-processing pipelines. Focus on result validation and data protection.' : 'Build service APIs, design data storage, and write integration tests. Work with the product team to maintain service quality.' })),
    applications: rows.map(([, , status, updatedAt, resumeVersionId], i) => ({ id: `A${String(i + 1).padStart(2, '0')}`, jobId: `J${String(i + 1).padStart(2, '0')}`, status, updatedAt, resumeVersionId, notes: '', interviewNote: '' })),
    resumes: [
      { id: 'CV01', name: 'Backend CV v1', reviewState: 'reviewed', text: sourceText, createdAt: '2026-11-10T08:00:00+08:00' },
      { id: 'CV02', name: 'Backend CV v2', reviewState: 'pending', text: sourceText, createdAt: '2026-11-14T16:00:00+08:00' },
    ],
    drafts: [{ id: 'D01', name: 'System Foundry draft', sourceResumeId: 'CV01', jobId: 'J02', reviewState: 'pending', text: sourceText, createdAt: '2026-11-15T08:50:00+08:00' }],
    events: [
      { id: 'E01', text: 'Northline saved', target: '#/jobs/J01', occurredAt: '2026-11-15T09:10:00+08:00' },
      { id: 'E02', text: 'System Foundry draft updated', target: '#/cv/D01', occurredAt: '2026-11-15T08:50:00+08:00' },
      { id: 'E03', text: 'CV extraction ready for review', target: '#/cv/CV02', occurredAt: '2026-11-14T16:20:00+08:00' },
    ], reminders: [],
  };
}
export function emptyWorkspace(): WorkspaceData { return { jobs: [], applications: [], resumes: [], drafts: [], events: [], reminders: [] }; }
export const stageLabel = (value: Stage) => stages.find(([key]) => key === value)?.[1] ?? value;
export const counts = (data: WorkspaceData) => Object.fromEntries(stages.map(([stage]) => [stage, data.applications.filter(a => a.status === stage).length])) as Record<Stage, number>;
export function tasks(data: WorkspaceData) {
  return [
    ...data.resumes.filter(r => r.reviewState === 'pending').map(r => ({ id: r.id, action: 'Review extraction', name: r.name, target: `#/cv/${r.id}` })),
    ...data.jobs.filter(j => !j.description.trim()).map(j => ({ id: j.id, action: 'Complete description', name: j.company, target: `#/jobs/${j.id}?edit=description` })),
    ...data.drafts.filter(r => r.reviewState === 'pending').map(r => ({ id: r.id, action: 'Review draft', name: r.name, target: `#/cv/${r.id}/tailored` })),
  ];
}
export function filteredApplications(data: WorkspaceData, query = '', status = '', order = 'newest') {
  const q = query.toLocaleLowerCase('en').trim();
  return data.applications.filter(a => {
    const job = data.jobs.find(j => j.id === a.jobId);
    return job && (!status || a.status === status) && `${job.title} ${job.company}`.toLocaleLowerCase('en').includes(q);
  }).sort((a, b) => (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) * (order === 'oldest' ? -1 : 1) || a.id.localeCompare(b.id));
}
export function validateJob(input: { title: string; company: string; description: string; sourceUrl: string }) {
  if (!input.title.trim() || !input.company.trim() || !input.description.trim()) return 'Enter a title, company, and job description.';
  if (input.title.length > 150 || input.company.length > 150 || input.description.length > 20000) return 'Title and company must be 150 characters or fewer; the description must be 20,000 characters or fewer.';
  if (input.sourceUrl.trim()) { try { if (!['https:', 'http:'].includes(new URL(input.sourceUrl).protocol)) return 'The URL must use http or https.'; } catch { return 'Enter a valid URL.'; } }
  return '';
}
export function addJob(data: WorkspaceData, input: Omit<Job, 'id' | 'createdAt' | 'notes'>, at: string): WorkspaceData {
  const error = validateJob(input); if (error) throw new Error(error);
  const n = Math.max(0, ...data.jobs.map(j => Number(j.id.slice(1)) || 0)) + 1;
  const id = `J${String(n).padStart(2, '0')}`, aid = `A${String(n).padStart(2, '0')}`;
  const job = { ...input, title: input.title.trim(), company: input.company.trim(), description: input.description.trim(), sourceUrl: input.sourceUrl.trim(), id, createdAt: at, notes: '' };
  return { ...data, jobs: [...data.jobs, job], applications: [...data.applications, { id: aid, jobId: id, status: 'saved', resumeVersionId: null, updatedAt: at, notes: '', interviewNote: '' }], events: [{ id: `E-${aid}`, text: `${job.company} saved`, target: `#/jobs/${id}`, occurredAt: at }, ...data.events] };
}
export function updateStage(data: WorkspaceData, id: string, status: Stage, at: string): WorkspaceData {
  if (!stages.some(([key]) => key === status)) throw new Error('Invalid application stage.');
  const application = data.applications.find(a => a.id === id);
  if (!application) throw new Error('Application not found.');
  if (application.status === status) return data;
  const job = data.jobs.find(j => j.id === application.jobId)!;
  return { ...data, applications: data.applications.map(a => a.id === id ? { ...a, status, updatedAt: at } : a), events: [{ id: `E-${id}-${at}`, text: `${job.company} · ${stageLabel(status)}`, target: `#/applications/${id}`, occurredAt: at }, ...data.events] };
}
export function reviewDocument(data: WorkspaceData, id: string, at: string): WorkspaceData {
  const doc = [...data.resumes, ...data.drafts].find(r => r.id === id);
  if (!doc || doc.reviewState !== 'pending') return data;
  return { ...data, resumes: data.resumes.map(r => r.id === id ? { ...r, reviewState: 'reviewed' } : r), drafts: data.drafts.map(r => r.id === id ? { ...r, reviewState: 'reviewed' } : r), events: [{ id: `E-${id}-${at}`, text: `${doc.name} reviewed`, target: `#/cv/${id}`, occurredAt: at }, ...data.events] };
}
export function validateUpload(name: string, size: number, bytes: Uint8Array) {
  if (size <= 0 || size > 10 * 1024 * 1024) return 'The file must contain data and be no larger than 10 MiB.';
  const pdf = name.toLowerCase().endsWith('.pdf') && new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  const docx = name.toLowerCase().endsWith('.docx') && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4;
  return pdf || docx ? '' : 'Choose a PDF or DOCX with a valid file signature.';
}
const initial = createSample();
console.assert(initial.jobs.length === 12 && initial.applications.length === 12, 'Sample job/application total');
console.assert(JSON.stringify(Object.values(counts(initial))) === '[3,3,2,2,0,1,1]', 'Sample stage totals');
console.assert(tasks(initial).length === 3, 'Sample outstanding tasks');
console.assert(initial.applications.every(a => initial.jobs.some(j => j.id === a.jobId) && (!a.resumeVersionId || initial.resumes.some(r => r.id === a.resumeVersionId))), 'Sample references');
console.assert(initial.applications.filter(a => a.resumeVersionId === 'CV01').length === 10, 'Sample resume references');
console.assert(initial.reminders.length === 0, 'Sample reminders');
