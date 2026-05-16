export type ParsedResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export async function parseResponse<T = unknown>(res: Response): Promise<ParsedResponse<T>> {
  const status = res.status;
  let text = "";
  try {
    text = await res.text();
  } catch {
    return { ok: res.ok, status, data: null, error: `Network error (${status})` };
  }
  if (!text) {
    return {
      ok: res.ok,
      status,
      data: null,
      error: res.ok ? null : `Server returned an empty response (${status}). The database may not be migrated yet.`,
    };
  }
  try {
    const json = JSON.parse(text) as unknown;
    const error =
      json && typeof json === "object" && "error" in json && typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : null;
    return {
      ok: res.ok,
      status,
      data: json as T,
      error: res.ok ? null : (error || `Server error (${status})`),
    };
  } catch {
    return {
      ok: res.ok,
      status,
      data: null,
      error: text.slice(0, 200),
    };
  }
}
