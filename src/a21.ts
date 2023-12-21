import { Map2D, Map2DNode } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a21.txt");

const map = Map2D.fromLines(lines, (c) => c);

const starts = map.getNodes().filter((node) => node.value === "S");

interface Position {
  readonly x: number;
  readonly y: number;
}

function positionKey(pos: Position): string {
  return pos.x + ";" + pos.y;
}

function fourNeighbors({ x, y }: Position): Position[] {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
}

function simulateWalk(starts: Map2DNode<string>[], steps: number): number[] {
  let currentPositions: Position[] = starts.map((node) => ({ x: node.x, y: node.y }));
  const w = map.width;
  const h = map.height;
  const counts: number[] = [];
  for (let i = 0; i < steps; i++) {
    const reachedPositions = new Map<string, Position>();

    currentPositions.forEach((position) => {
      fourNeighbors(position)
        .filter(({ x, y }) => (map.get(((x % w) + w) % w, ((y % h) + h) % h) ?? "#") !== "#")
        .forEach((position) => reachedPositions.set(positionKey(position), position));
    });

    currentPositions = [...reachedPositions.values()];

    counts.push(currentPositions.length);
  }
  return counts;
}

const counts = simulateWalk(starts, 64);
p(counts[63]);

// for (let i = 1; i < counts.length; i++) {
//   p([counts[i] - counts[i - 1], i, counts[i]]);
// }
