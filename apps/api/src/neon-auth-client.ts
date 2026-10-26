/** Test/helper client for Managed Better Auth email+password + JWT. */

export type NeonAuthUser = { id: string; email: string };

export async function neonSignUp(input: {
  baseUrl: string;
  email: string;
  password: string;
  name?: string;
  origin?: string;
}): Promise<{ user: NeonAuthUser; cookie: string }> {
  const origin = input.origin ?? 'http://localhost:5173';
  const response = await fetch(`${input.baseUrl.replace(/\/$/, '')}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name ?? 'Playball',
    }),
  });
  if (!response.ok) {
    throw new Error(`sign-up failed: ${response.status} ${await response.text()}`);
  }
  const json = (await response.json()) as { user: NeonAuthUser };
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const cookie =
    setCookie.find(v => v.startsWith('__Secure-neon-auth.session_token='))?.split(';')[0] ??
    response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('sign-up missing session cookie');
  return { user: json.user, cookie };
}

export async function neonSignIn(input: {
  baseUrl: string;
  email: string;
  password: string;
  origin?: string;
}): Promise<{ user: NeonAuthUser; cookie: string }> {
  const origin = input.origin ?? 'http://localhost:5173';
  const response = await fetch(`${input.baseUrl.replace(/\/$/, '')}/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
  if (!response.ok) {
    throw new Error(`sign-in failed: ${response.status} ${await response.text()}`);
  }
  const json = (await response.json()) as { user: NeonAuthUser };
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const cookie =
    setCookie.find(v => v.startsWith('__Secure-neon-auth.session_token='))?.split(';')[0] ??
    response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('sign-in missing session cookie');
  return { user: json.user, cookie };
}

export async function neonFetchJwt(input: {
  baseUrl: string;
  cookie: string;
  origin?: string;
}): Promise<string> {
  const origin = input.origin ?? 'http://localhost:5173';
  const response = await fetch(`${input.baseUrl.replace(/\/$/, '')}/token`, {
    headers: { Origin: origin, Cookie: input.cookie },
  });
  if (!response.ok) {
    throw new Error(`token failed: ${response.status} ${await response.text()}`);
  }
  const json = (await response.json()) as { token?: string };
  if (!json.token) throw new Error('token missing');
  return json.token;
}
