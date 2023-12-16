import { Map2D, Map2DNode } from "./util/map2D";
import { findMax, p, readLines } from "./util/util";

const lines = readLines("input/a16.txt");

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

const SYMBOL_TO_OUTS: Record<string, number[][]> = {
  ".": [[NORTH], [EAST], [SOUTH], [WEST]],
  "/": [[EAST], [NORTH], [WEST], [SOUTH]],
  "\\": [[WEST], [SOUTH], [EAST], [NORTH]],
  "|": [[NORTH], [NORTH, SOUTH], [SOUTH], [NORTH, SOUTH]],
  "-": [[WEST, EAST], [EAST], [WEST, EAST], [WEST]],
};

const NEIGHBOR_FUNCTIONS: ((node: Map2DNode<Cell>) => Map2DNode<Cell>)[] = [
  (node) => node.up,
  (node) => node.right,
  (node) => node.down,
  (node) => node.left,
];

interface Cell {
  readonly symbol: string;
  directions: number;
}

const map: Map2D<Cell> = Map2D.fromLines(lines, (symbol) => ({ symbol, directions: 0 }));
const nodes = map.getNodes();

function countEnergized(start: Map2DNode<Cell>, startDirection: number): number {
  // reset the map
  nodes.forEach((node) => node.value && (node.value.directions = 0));

  const queue: { node: Map2DNode<Cell>; direction: number }[] = [{ node: start, direction: startDirection }];

  while (queue.length) {
    const { node, direction } = queue.shift()!;
    const directionBit = 1 << direction;
    const cell = node.value;

    if (cell && !(cell.directions & directionBit)) {
      cell.directions |= directionBit;
      const symbol = cell.symbol;
      SYMBOL_TO_OUTS[symbol][direction].forEach((outDirection) => {
        const neighbor = NEIGHBOR_FUNCTIONS[outDirection](node);
        queue.push({
          node: neighbor,
          direction: outDirection,
        });
      });
    }
  }

  return nodes.filter((node) => node.value?.directions).length;
}

p(countEnergized(map.getNode(0, 0), EAST));

p(
  findMax(nodes, (node) => {
    const directions = NEIGHBOR_FUNCTIONS.map((neighborFunction, direction) =>
      neighborFunction(node).value ? undefined : (direction + 2) % 4
    ).filter((direction) => direction !== undefined);
    if (!directions.length) {
      // inner node
      return 0;
    } else {
      return findMax(directions, (direction) => countEnergized(node, direction!)).max!;
    }
  }).max
);
