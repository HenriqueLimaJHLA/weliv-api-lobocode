/**
 * Converte strings ISO dos DTOs em `Date` nos campos indicados (Prisma).
 */
export function withDateFields<T extends object>(data: T, keys: (keyof T)[]): T {
  const out = { ...data } as Record<string, unknown>;
  for (const k of keys) {
    const v = out[k as string];
    if (v != null && v !== '' && typeof v === 'string') {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) {
        out[k as string] = d;
      }
    }
  }
  return out as T;
}
