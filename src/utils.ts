const A440 = 440;

export function map(inMin: number, inMax: number, outMin: number, outMax: number, number: number): number {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export const truncate = (number: number=0) => Number(number.toFixed(2));

export const hzToCents = (hz: number) => 1200 * Math.log2(hz / A440);

export const centsOff = (hz: number) => truncate(hzToCents(hz) % 100);

export const make2DArray = (columns: number, rows: number): number[][] => {
  return Array.from({ length: columns }, () => Array.from({ length: rows }, () => 0));
};
