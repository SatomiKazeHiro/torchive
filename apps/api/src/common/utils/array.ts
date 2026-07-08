export function normalizeToArray<T>(input: T | T[] | null | undefined): T[] {
  if (input == null) return [];
  return Array.isArray(input) ? input : [input];
}
