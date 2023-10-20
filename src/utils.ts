import * as Tone from "tone";

const A440 = 440;

export function map(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  number: number
): number {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export const truncate = (number: number = 0) => Number(number.toFixed(2));

export const centsFromHzToHz = (hz: number, fromHz: number = A440) =>
  1200 * Math.log2(hz / fromHz);

export const centsOff = (hz: number, fromHz: number = A440) =>
  truncate(centsFromHzToHz(hz, fromHz) % 100);

export const noteHz = (hz: number) => Tone.Frequency(hz).toNote();

export const noteCents = (hz: number) => noteHz(hz) + ", " + centsOff(hz);

export const make2DArray = (columns: number, rows: number): number[][] => {
  return Array.from({ length: columns }, () =>
    Array.from({ length: rows }, () => 0)
  );
};

export function createSpiralArray(size: number): number[][] {
  if (size % 2 === 0) {
    throw new Error("Input must be an odd number.");
  }

  const spiralArray: number[][] = make2DArray(size, size);

  let num = size * size;

  let row = Math.floor(size / 2);
  let col = Math.floor(size / 2);

  let stepsTaken = 0;
  let turns = 0;
  let toTravel = 1;
  let direction = 0; // 0 = right, 1 = down, 2 = left, 3 = up

  const turn = () => {
    direction = (direction + 1) % 4;
    turns++;
  };
  const move = () => {
    // Move in the current direction
    if (direction === 0) col++;
    else if (direction === 1) row++;
    else if (direction === 2) col--;
    else if (direction === 3) row--;
    stepsTaken++;
  };

  const place = () => {
    spiralArray[row][col] = num;
    num--;
  };

  while (num > 0) {
    place();
    move();

    if (stepsTaken === toTravel) {
      turn();
      stepsTaken = 1;
      if (turns < 3) {
        toTravel++
      } else if (turns % 2 === 0){ 
        toTravel++
      }
    }
  }

  return spiralArray;
}

// Example usage:
const n = 7; // Replace with the desired odd number for the size of the square array
const spiralArray = createSpiralArray(n);
console.log(spiralArray);
