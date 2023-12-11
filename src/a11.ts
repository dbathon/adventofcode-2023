import { p, readLines } from "./util/util";

const lines = readLines("input/a11.txt");

const emptyColumns = new Set(
  lines[0].split("").flatMap((_, i) => (lines.every((line) => line.charAt(i) !== "#") ? [i] : []))
);

interface Galaxy {
  x: number;
  y: number;
}

function distanceSum(offset: number): number {
  const galaxies: Galaxy[] = [];
  let yOffset = 0;
  lines.forEach((line, y) => {
    let xOffset = 0;
    let allEmpty = true;
    line.split("").forEach((c, x) => {
      if (c == "#") {
        galaxies.push({ x: x + xOffset, y: y + yOffset });
        allEmpty = false;
      } else if (emptyColumns.has(x)) {
        xOffset += offset;
      }
    });
    if (allEmpty) {
      yOffset += offset;
    }
  });

  let sum = 0;
  for (let i = 0; i < galaxies.length; i++) {
    for (let j = i + 1; j < galaxies.length; j++) {
      const xDist = Math.abs(galaxies[i].x - galaxies[j].x);
      const yDist = Math.abs(galaxies[i].y - galaxies[j].y);
      sum += xDist + yDist;
    }
  }
  return sum;
}

p(distanceSum(1));
p(distanceSum(1000000 - 1));
