/** Response.json() is typed unknown under strict tests — cast once here. */
export async function json<T = Record<string, unknown>>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
