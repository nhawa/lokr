import { z } from 'zod';

import {
  isoUtcTimestampSchema,
  MAX_DISPLAY_FILENAME_CHARACTERS,
  MAX_RESUME_CONTENT_CHARACTERS,
  MAX_RESUME_LABEL_CHARACTERS,
  MAX_UPLOAD_BYTES,
  opaqueIdSchema,
  paginationMetadataSchema,
  paginationQuerySchema,
} from './common';

export const RESUMES_CONTRACT_VERSION = 'v1';
export const resumeRoutes = {
  collection: '/api/v1/resumes',
  versions: '/api/v1/resumes/{resumeId}/versions',
  version: '/api/v1/resumes/{resumeId}/versions/{versionId}',
  content: '/api/v1/resumes/{resumeId}/versions/{versionId}/content',
  review: '/api/v1/resumes/{resumeId}/versions/{versionId}/review',
} as const;

const supportedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const;
const filenamePattern = /^[^/\\\u0000-\u001F\u007F]+\.(pdf|docx)$/i;
const checksumPattern = /^sha256:[a-f0-9]{64}$/;
const revisionPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;

export const extractionStatusSchema = z.enum(['queued', 'processing', 'ready', 'failed']);
export const reviewStatusSchema = z.enum(['not_ready', 'needs_review', 'reviewed']);
export const extractionFailureCategorySchema = z.enum(['unsupported_document', 'unreadable_document', 'processing_unavailable']);
export const contentSourceSchema = z.enum(['parsed', 'owner_edit']);

export const displayFilenameSchema = z.string().trim().min(1).max(MAX_DISPLAY_FILENAME_CHARACTERS).regex(
  filenamePattern,
  'Filename must be a PDF or DOCX name without path separators or control characters.',
);
export const mimeTypeSchema = z.enum(supportedMimeTypes);
export const checksumSchema = z.string().regex(checksumPattern, 'Checksum must be a lowercase SHA-256 value.');
export const revisionTokenSchema = z.string().regex(revisionPattern, 'Expected an opaque revision token.');

function extensionForMimeType(filename: string, mimeType: z.infer<typeof mimeTypeSchema>): boolean {
  return mimeType === 'application/pdf' ? filename.toLowerCase().endsWith('.pdf') : filename.toLowerCase().endsWith('.docx');
}

export const createResumeRequestSchema = z.object({
  label: z.string().trim().min(1).max(MAX_RESUME_LABEL_CHARACTERS),
  idempotencyKey: z.string().min(8).max(255).optional(),
}).strict();

export const uploadVersionMetadataSchema = z.object({
  filename: displayFilenameSchema,
  mimeType: mimeTypeSchema,
  byteSize: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
  idempotencyKey: z.string().min(8).max(255).optional(),
}).strict().refine(
  ({ filename, mimeType }) => extensionForMimeType(filename, mimeType),
  { message: 'Filename extension must match the declared MIME type.', path: ['filename'] },
);

export const documentMetadataSchema = z.object({
  filename: displayFilenameSchema,
  mimeType: mimeTypeSchema,
  byteSize: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
  checksum: checksumSchema,
  uploadedAt: isoUtcTimestampSchema,
}).strict();

export const resumeSummarySchema = z.object({
  id: opaqueIdSchema,
  label: z.string().min(1).max(MAX_RESUME_LABEL_CHARACTERS),
  createdAt: isoUtcTimestampSchema,
  updatedAt: isoUtcTimestampSchema,
  latestVersion: z.object({
    id: opaqueIdSchema,
    version: z.number().int().positive(),
    extractionStatus: extractionStatusSchema,
    reviewStatus: reviewStatusSchema,
    createdAt: isoUtcTimestampSchema,
  }).strict().nullable(),
}).strict();

export const resumeListResponseSchema = z.object({
  data: z.array(resumeSummarySchema),
  page: paginationMetadataSchema,
}).strict();

export const resumeVersionSummarySchema = z.object({
  id: opaqueIdSchema,
  version: z.number().int().positive(),
  document: documentMetadataSchema,
  extractionStatus: extractionStatusSchema,
  reviewStatus: reviewStatusSchema,
  createdAt: isoUtcTimestampSchema,
}).strict();

export const contentDocumentSchema = z.object({
  parsedText: z.string().min(1).max(MAX_RESUME_CONTENT_CHARACTERS).nullable(),
  editedText: z.string().min(1).max(MAX_RESUME_CONTENT_CHARACTERS).nullable(),
  source: contentSourceSchema,
  revision: revisionTokenSchema,
  reviewedAt: isoUtcTimestampSchema.nullable(),
}).strict().superRefine((content, context) => {
  if (content.source === 'parsed' && !content.parsedText) {
    context.addIssue({ code: 'custom', path: ['parsedText'], message: 'Parsed source requires parsed text.' });
  }
  if (content.source === 'owner_edit' && !content.editedText) {
    context.addIssue({ code: 'custom', path: ['editedText'], message: 'Owner-edited source requires edited text.' });
  }
});

export const resumeVersionDetailSchema = z.object({
  id: opaqueIdSchema,
  resumeId: opaqueIdSchema,
  version: z.number().int().positive(),
  document: documentMetadataSchema,
  extractionStatus: extractionStatusSchema,
  reviewStatus: reviewStatusSchema,
  extractionFailureCategory: extractionFailureCategorySchema.nullable(),
  content: contentDocumentSchema.nullable(),
  createdAt: isoUtcTimestampSchema,
  updatedAt: isoUtcTimestampSchema,
}).strict().superRefine((version, context) => {
  const requireNotReady = (): void => {
    if (version.reviewStatus !== 'not_ready') {
      context.addIssue({ code: 'custom', path: ['reviewStatus'], message: 'Review is unavailable until extraction is ready.' });
    }
  };

  if (version.extractionStatus === 'queued' || version.extractionStatus === 'processing') {
    if (version.content !== null) {
      context.addIssue({ code: 'custom', path: ['content'], message: 'Content is unavailable until extraction is ready.' });
    }
    if (version.extractionFailureCategory !== null) {
      context.addIssue({ code: 'custom', path: ['extractionFailureCategory'], message: 'A failure category is only allowed for failed extraction.' });
    }
    requireNotReady();
    return;
  }

  if (version.extractionStatus === 'failed') {
    if (version.content !== null) {
      context.addIssue({ code: 'custom', path: ['content'], message: 'Failed extraction cannot include content.' });
    }
    if (version.extractionFailureCategory === null) {
      context.addIssue({ code: 'custom', path: ['extractionFailureCategory'], message: 'Failed extraction requires a safe failure category.' });
    }
    requireNotReady();
    return;
  }

  if (version.content === null) {
    context.addIssue({ code: 'custom', path: ['content'], message: 'Ready extraction requires content.' });
  }
  if (version.extractionFailureCategory !== null) {
    context.addIssue({ code: 'custom', path: ['extractionFailureCategory'], message: 'Ready extraction cannot include a failure category.' });
  }
  if (version.reviewStatus === 'not_ready') {
    context.addIssue({ code: 'custom', path: ['reviewStatus'], message: 'Ready extraction requires review availability.' });
  }
  if (version.content && version.reviewStatus === 'reviewed' && version.content.reviewedAt === null) {
    context.addIssue({ code: 'custom', path: ['content', 'reviewedAt'], message: 'Reviewed content requires a review completion timestamp.' });
  }
  if (version.content && version.reviewStatus === 'needs_review' && version.content.reviewedAt !== null) {
    context.addIssue({ code: 'custom', path: ['content', 'reviewedAt'], message: 'Content awaiting review cannot include a review completion timestamp.' });
  }
});

export const updateContentRequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_RESUME_CONTENT_CHARACTERS),
  source: contentSourceSchema,
  revision: revisionTokenSchema,
}).strict();

export const reviewRequestSchema = z.object({
  revision: revisionTokenSchema,
  confirm: z.literal(true),
}).strict();

export const resumeListQuerySchema = paginationQuerySchema;

export type CreateResumeRequest = z.infer<typeof createResumeRequestSchema>;
export type UploadVersionMetadata = z.infer<typeof uploadVersionMetadataSchema>;
export type ResumeSummary = z.infer<typeof resumeSummarySchema>;
export type ResumeListResponse = z.infer<typeof resumeListResponseSchema>;
export type ResumeVersionDetail = z.infer<typeof resumeVersionDetailSchema>;
export type UpdateContentRequest = z.infer<typeof updateContentRequestSchema>;
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
