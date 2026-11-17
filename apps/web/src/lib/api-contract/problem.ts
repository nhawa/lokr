import { z } from 'zod';

import { requestIdSchema } from './common';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';
export const PROBLEM_TYPE_BASE_URL = 'https://lokr.local/problems/';

export const apiErrorCodeSchema = z.enum([
  'malformed_request',
  'validation_failed',
  'export_request_invalid',
  'export_unavailable',
  'unsupported_media_type',
  'invalid_file_signature',
  'upload_too_large',
  'not_found',
  'conflict',
  'extraction_unavailable',
  'extraction_failed',
  'internal_error',
]);

export const fieldIssueSchema = z.object({
  path: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
}).strict();

export const problemDetailsSchema = z.object({
  type: z.string().url(),
  title: z.string().min(1).max(200),
  status: z.number().int().min(400).max(599),
  code: apiErrorCodeSchema,
  detail: z.string().min(1).max(1_000),
  requestId: requestIdSchema,
  issues: z.array(fieldIssueSchema).max(100).optional(),
}).strict();

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type FieldIssue = z.infer<typeof fieldIssueSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

type ProblemDefinition = Pick<ProblemDetails, 'status' | 'title' | 'detail'>;

const problemDefinitions: Record<ApiErrorCode, ProblemDefinition> = {
  malformed_request: { status: 400, title: 'Malformed request', detail: 'The request could not be read.' },
  validation_failed: { status: 400, title: 'Validation failed', detail: 'One or more fields are invalid.' },
  export_request_invalid: { status: 400, title: 'Invalid export request', detail: 'The PDF export request is invalid.' },
  export_unavailable: { status: 503, title: 'PDF export unavailable', detail: 'PDF export is temporarily unavailable.' },
  unsupported_media_type: { status: 415, title: 'Unsupported media type', detail: 'The supplied media type is not supported.' },
  invalid_file_signature: { status: 422, title: 'Invalid file signature', detail: 'The uploaded file does not match its declared document format.' },
  upload_too_large: { status: 413, title: 'Upload too large', detail: 'The uploaded file exceeds the permitted size.' },
  not_found: { status: 404, title: 'Not found', detail: 'The requested resource was not found.' },
  conflict: { status: 409, title: 'Conflict', detail: 'The request conflicts with the current resource state.' },
  extraction_unavailable: { status: 503, title: 'Extraction unavailable', detail: 'Document extraction is temporarily unavailable.' },
  extraction_failed: { status: 422, title: 'Extraction failed', detail: 'Document extraction could not complete.' },
  internal_error: { status: 500, title: 'Internal server error', detail: 'The server could not complete the request.' },
};

export function problem(code: ApiErrorCode, requestId: string, options: Partial<Pick<ProblemDetails, 'detail' | 'issues'>> = {}): ProblemDetails {
  const definition = problemDefinitions[code];
  return problemDetailsSchema.parse({
    type: `${PROBLEM_TYPE_BASE_URL}${code}`,
    title: definition.title,
    status: definition.status,
    code,
    detail: options.detail ?? definition.detail,
    requestId,
    ...(options.issues ? { issues: options.issues } : {}),
  });
}

export function validationProblem(requestId: string, issues: FieldIssue[]): ProblemDetails {
  return problem('validation_failed', requestId, { issues });
}

export function problemResponse(problemDetails: ProblemDetails): Response {
  return Response.json(problemDetails, {
    status: problemDetails.status,
    headers: { 'Content-Type': PROBLEM_CONTENT_TYPE },
  });
}
