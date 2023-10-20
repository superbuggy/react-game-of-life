const A440 = 440;

export function map(inMin: number, inMax: number, outMin: number, outMax: number, number: number): number {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export const truncate = (number: number) => Number(number.toFixed(2));

export const hzToCents = (hz: number) => 1200 * Math.log2(hz / A440);

export const centsOff = (hz: number) => truncate(hzToCents(hz) % 100);
