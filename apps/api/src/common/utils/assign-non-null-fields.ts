export function assignNonNullFields<T extends object>(
  target: T,
  source: Partial<T>,
  fields: (keyof T)[],
): T {
  fields.forEach((field) => {
    const value = source[field];
    if (value !== undefined && value !== null) {
      target[field] = value;
    }
  });
  return target;
}
