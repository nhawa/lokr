import { z } from 'zod';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_RESUME_CONTENT_CHARACTERS = 100_000;
export const MAX_RESUME_LABEL_CHARACTERS = 150;
export const MAX_DISPLAY_FILENAME_CHARACTERS = 255;

const opaqueIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/;
const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/;
const cursorPattern = /^[A-Za-z0-9_-]{8,512}$/;

export const opaqueIdSchema = z.string().regex(opaqueIdPattern, 'Expected an opaque identifier.');
export const requestIdSchema = z.string().regex(requestIdPattern, 'Expected a request identifier.');
export const isoUtcTimestampSchema = z.string().datetime({ offset: true }).refine(
  (value) => value.endsWith('Z'),
  'Expected an ISO 8601 UTC timestamp.',
);
export const sortableDirectionSchema = z.enum(['asc', 'desc']);
export const cursorSchema = z.string().regex(cursorPattern, 'Expected an opaque cursor.');
export const paginationQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  direction: sortableDirectionSchema.default('desc'),
}).strict();
export const paginationMetadataSchema = z.object({
  nextCursor: cursorSchema.nullable(),
  limit: z.number().int().min(1).max(100),
}).strict();

export type OpaqueId = z.infer<typeof opaqueIdSchema>;
export type RequestId = z.infer<typeof requestIdSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
