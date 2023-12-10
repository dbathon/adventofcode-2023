import { Neighbor, dijkstraSearch } from "./util/graphUtil";
import { Map2D, Map2DNode } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a10.txt");

const NORTH = 0b0001;
const EAST = 0b0010;
const SOUTH = 0b0100;
const WEST = 0b1000;

function opposite(direction: number) {
  return direction > EAST ? direction >>> 2 : direction << 2;
}

const PIPE_DIRECTIONS: Record<string, number> = {
  "|": NORTH | SOUTH,
  "-": WEST | EAST,
  L: NORTH | EAST,
  J: NORTH | WEST,
  "7": SOUTH | WEST,
  F: SOUTH | EAST,
};

const directionToNeighborFunction: [number, (node: Map2DNode<number>) => Map2DNode<number>][] = [
  [NORTH, (node) => node.up],
  [EAST, (node) => node.right],
  [SOUTH, (node) => node.down],
  [WEST, (node) => node.left],
];

const map = new Map2D<number>();

let start = map.getNode(0, 0);

lines.forEach((line, y) => {
  line.split("").forEach((c, x) => {
    const directions = PIPE_DIRECTIONS[c];
    if (directions) {
      map.set(x, y, directions);
    } else if (c === "S") {
      start = map.getNode(x, y);
    }
  });
});

let startDirections = 0;
directionToNeighborFunction.forEach(([direction, neighborFunction]) => {
  if ((neighborFunction(start).value ?? 0) & opposite(direction)) {
    startDirections |= direction;
  }
});
start.value = startDirections;

let maxDistance = 0;

const filteredMap = new Map2D<number>();

// dijkstra is kind of overkill, but it works :)
dijkstraSearch(
  (node, _, distance) => {
    maxDistance = distance;
    filteredMap.set(node.x, node.y, node.value);
    return directionToNeighborFunction.flatMap(([direction, neighborFunction]) => {
      const neighbor = neighborFunction(node);
      if ((node.value ?? 0) & direction && (neighbor.value ?? 0) & opposite(direction)) {
        return [new Neighbor(neighbor, 1, 0)];
      }
      return [];
    });
  },
  start,
  0
);

p(maxDistance);

let insideCount = 0;
const NORTH_SOUTH = NORTH | SOUTH;
for (let y = 0; y < filteredMap.height; y++) {
  let inside = false;
  let seenVertical = 0;
  for (let x = 0; x < filteredMap.width; x++) {
    const directions = filteredMap.get(x, y);
    if (directions) {
      const northSouthDirections = directions & NORTH_SOUTH;
      if (northSouthDirections) {
        seenVertical ^= northSouthDirections;
        if (seenVertical == NORTH_SOUTH) {
          inside = !inside;
          seenVertical = 0;
        }
      }
    } else if (inside) {
      ++insideCount;
    }
  }
}

p(insideCount);
