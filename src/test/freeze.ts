/** Catch accidental mutations in operations that promise immutable results. */
export function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.freeze(value)
    Object.values(value).forEach(freeze)
  }
  return value
}
