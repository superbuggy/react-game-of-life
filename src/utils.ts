export function map (
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  number: number
): number {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
