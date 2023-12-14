import { Map2D } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a14.txt");

function rollNorth(map: Map2D<string>): void {
  const yMin: number[] = [];
  map.forEach((x, y, c) => {
    if (c === "#") {
      yMin[x] = y + 1;
    } else if (c === "O") {
      const newY = yMin[x] ?? 0;
      map.set(x, y, undefined);
      map.set(x, newY, c);
      yMin[x] = newY + 1;
    }
  });
}

function calculateLoad(map: Map2D<string>): number {
  const height = map.height;
  let sum = 0;
  map.forEach((x, y, c) => {
    if (c === "O") {
      sum += height - y;
    }
  });
  return sum;
}

const map = Map2D.fromLines(lines, (c) => (c === "." ? undefined : c));

const part1Map = map.copy();
rollNorth(part1Map);
p(calculateLoad(part1Map));

function spinCycle(map: Map2D<string>): Map2D<string> {
  let tmpMap = map.copy();

  // north
  rollNorth(tmpMap);

  // west
  tmpMap = tmpMap.rotateRight();
  rollNorth(tmpMap);

  // south
  tmpMap = tmpMap.rotateRight();
  rollNorth(tmpMap);

  // east
  tmpMap = tmpMap.rotateRight();
  rollNorth(tmpMap);

  return tmpMap.rotateRight();
}

let part2Map = map.copy();

const keyToI = new Map<string, number>();
let cycleFound = false;
const totalCycles = 1000000000;
for (let i = 0; i < totalCycles; i++) {
  if (!cycleFound) {
    const key = part2Map.draw();
    const prevI = keyToI.get(key);
    if (prevI !== undefined) {
      cycleFound = true;
      const cycleLength = i - prevI;
      i += cycleLength * Math.floor((totalCycles - i) / cycleLength);
    }
    keyToI.set(key, i);
  }
  part2Map = spinCycle(part2Map);
}

p(calculateLoad(part2Map));
