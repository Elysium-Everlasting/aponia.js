/**
 * Convert a Date to a Unix timestamp.
 *
 * @default Returns the current time as a timestamp.
 */
export function getTimestamp(time = Date.now()) {
  return (time / 1000) | 0
}
