export function  map (inMin, inMax, outMin, outMax, number) {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}