export type PageParams = { limit?: number; page?: number; cursor?: string | null };

export function buildOffsetPagination({ page = 1, limit = 50 }: PageParams) {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const offset = (page - 1) * safeLimit;
  return { limit: safeLimit, offset };
}

export function decodeCursor(cursor?: string | null): { created_at: string; id: string } | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function encodeCursor(row: { created_at: string; id: string }) {
  return Buffer.from(JSON.stringify({ created_at: row.created_at, id: row.id })).toString('base64');
}
