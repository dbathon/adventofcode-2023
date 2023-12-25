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

function simulateWalk(starts: Map2DNode<string>[], steps: number): Position[][] {
  let currentPositions: Position[] = starts.map((node) => ({ x: node.x, y: node.y }));
  const w = map.width;
  const h = map.height;
  const positionsAfterSteps: Position[][] = [currentPositions];
  for (let i = 0; i < steps; i++) {
    const reachedPositions = new Map<string, Position>();

    currentPositions.forEach((position) => {
      fourNeighbors(position)
        .filter(({ x, y }) => (map.get(((x % w) + w) % w, ((y % h) + h) % h) ?? "#") !== "#")
        .forEach((position) => reachedPositions.set(positionKey(position), position));
    });

    currentPositions = [...reachedPositions.values()];

    positionsAfterSteps.push(currentPositions);
  }
  return positionsAfterSteps;
}

const positionsAfterSteps = simulateWalk(starts, 327);
p(positionsAfterSteps[64].length);

// after observation of the input and a few runs/outputs of the following...:
// {
//   let findY = 0;
//   positionsAfterSteps.forEach((positions, i) => {
//     const filtered = positions.filter((position) => position.y <= findY);
//     if (filtered.length) {
//       p([i, findY, filtered]);

//       const countByQuadrant: Record<string, number> = {};
//       positions.forEach((position) => {
//         const quadrantX = Math.floor(position.x / map.width);
//         const quadrantY = Math.floor(position.y / map.height);
//         const key = quadrantX + "," + quadrantY;
//         countByQuadrant[key] = (countByQuadrant[key] ?? 0) + 1;
//       });

//       Object.entries(countByQuadrant)
//         .sort((a, b) => a[1] - b[1])
//         .forEach(([key, count]) => p(key + ": " + count));

//       findY -= map.height;
//     }
//   });
// }

// ... it becomes clear that there is a "diamond" in the original map after 65 steps
// and after 131 further steps there is another diamond that is two map heights higher etc.
// and 26501365 === 202300 * 131 + 65
// so the final result can be calculated from the quadrant counts after 2 * 131 + 65 = 327 steps

const countByQuadrant: Record<string, number> = {};
positionsAfterSteps[327].forEach((position) => {
  const quadrantX = Math.floor(position.x / map.width);
  const quadrantY = Math.floor(position.y / map.height);
  const key = quadrantX + "," + quadrantY;
  countByQuadrant[key] = (countByQuadrant[key] ?? 0) + 1;
});

const factor = Math.floor(26501365 / 131);

const C = countByQuadrant;
const tips = C["-2,0"] + C["2,0"] + C["0,-2"] + C["0,2"];
const edges1 = factor * (C["-2,1"] + C["2,1"] + C["-2,-1"] + C["2,-1"]);
const edges2 = (factor - 1) * (C["-1,-1"] + C["-1,1"] + C["1,-1"] + C["1,1"]);

function sumOneToN(n: number): number {
  return (n * (n + 1)) / 2;
}

const inner1 = (sumOneToN(factor - 1) * 2 - (factor - 1)) * C["0,0"];
const inner2 = (sumOneToN(factor) * 2 - factor) * C["0,1"];

p(tips + edges1 + edges2 + inner1 + inner2);
