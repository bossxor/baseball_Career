import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { authAllowedSubjects, type PlayballDb, type TestDb } from '@playball/db';

export type AuthDb = PlayballDb | TestDb;

export type AppVariables = {
  subject: string;
  requestId: string;
  db: AuthDb;
};

export type AuthOptions = {
  /** Allow Bearer `dev:<subject>` for local/PGlite tests. */
  allowDevBearer?: boolean;
  neonAuthBaseUrl?: string;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksUrl: string | undefined;

function getJwks(neonAuthBaseUrl: string) {
  const url = `${neonAuthBaseUrl.replace(/\/$/, '')}/.well-known/jwks.json`;
  if (!jwks || jwksUrl !== url) {
    jwks = createRemoteJWKSet(new URL(url));
    jwksUrl = url;
  }
  return jwks;
}

async function resolveSubject(
  authorization: string,
  options: AuthOptions,
): Promise<string | null> {
  const header = authorization.trim();
  const bearer = /^Bearer\s+(.+)$/i.exec(header);
  if (!bearer) return null;
  const token = bearer[1]!;

  if (options.allowDevBearer) {
    const dev = /^dev:([A-Za-z0-9._:-]{1,128})$/.exec(token);
    if (dev) return dev[1]!;
  }

  if (!options.neonAuthBaseUrl) return null;
  try {
    const issuer = new URL(options.neonAuthBaseUrl).origin;
    const { payload } = await jwtVerify(token, getJwks(options.neonAuthBaseUrl), {
      issuer,
      algorithms: ['EdDSA'],
    });
    return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : null;
  } catch {
    return null;
  }
}

export function createRequireAuth(options: AuthOptions) {
  return async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
    const subject = await resolveSubject(c.req.header('Authorization') ?? '', options);
    if (!subject) {
      return c.json(
        { code: 'AUTH_REQUIRED', messageKey: 'auth.required', requestId: c.get('requestId') },
        401,
      );
    }
    const db = c.get('db');
    const [row] = await db
      .select()
      .from(authAllowedSubjects)
      .where(eq(authAllowedSubjects.subject, subject))
      .limit(1);
    if (!row || row.status !== 'ACTIVE') {
      return c.json(
        { code: 'AUTH_REQUIRED', messageKey: 'auth.forbidden', requestId: c.get('requestId') },
        401,
      );
    }
    c.set('subject', subject);
    await next();
  };
}
