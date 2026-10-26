import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { authAllowedSubjects, type PlayballDb, type TestDb } from '@playball/db';

export type AuthDb = PlayballDb | TestDb;

export type AppVariables = {
  subject: string;
  requestId: string;
  db: AuthDb;
};

/** ponytail: Bearer `dev:<subject>` until Neon Managed Auth wires in. */
export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header('Authorization') ?? '';
  const match = /^Bearer\s+dev:([A-Za-z0-9._:-]{1,128})$/.exec(header);
  if (!match) {
    return c.json({ code: 'AUTH_REQUIRED', messageKey: 'auth.required', requestId: c.get('requestId') }, 401);
  }
  const subject = match[1]!;
  const db = c.get('db');
  const [row] = await db
    .select()
    .from(authAllowedSubjects)
    .where(eq(authAllowedSubjects.subject, subject))
    .limit(1);
  if (!row || row.status !== 'ACTIVE') {
    return c.json({ code: 'AUTH_REQUIRED', messageKey: 'auth.forbidden', requestId: c.get('requestId') }, 401);
  }
  c.set('subject', subject);
  await next();
}
