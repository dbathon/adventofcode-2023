import { Node, dijkstraSearch } from "./util/graphUtil";
import { Map2D, Map2DNode } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a23.txt");

const NORTH = 0b0001;
const EAST = 0b0010;
const SOUTH = 0b0100;
const WEST = 0b1000;

function opposite(direction: number) {
  return direction > EAST ? direction >>> 2 : direction << 2;
}

const TILE_DIRECTIONS: Record<string, number> = {
  ".": NORTH | SOUTH | EAST | WEST,
  "^": NORTH,
  ">": EAST,
  v: SOUTH,
  "<": WEST,
};

const DIRECTION_TO_NEIGHBOR_FUNCTIONS: [number, (node: Map2DNode<string>) => Map2DNode<string>][] = [
  [NORTH, (node) => node.up],
  [EAST, (node) => node.right],
  [SOUTH, (node) => node.down],
  [WEST, (node) => node.left],
];

const map = Map2D.fromLines(lines, (c) => c);

class NodeWithState implements Node {
  readonly nodeKey: string;
  constructor(
    readonly node: Map2DNode<string>,
    readonly prevDirection: number,
    readonly seenForks: Set<string>
  ) {
    this.nodeKey = node.nodeKey + ";" + prevDirection + ";" + [...seenForks].sort().join(";");
  }
}

let max = 0;

dijkstraSearch(
  (state, distance, produceNode) => {
    const node = state.node;
    if (node.y === map.height - 1) {
      max = distance;
      return;
    }
    const coord = node.nodeKey;
    if (state.seenForks.has(coord)) {
      return;
    }
    const directions = TILE_DIRECTIONS[node.value ?? ""];
    if (directions) {
      const possibilities = DIRECTION_TO_NEIGHBOR_FUNCTIONS.filter(
        ([direction, fn]) =>
          direction !== opposite(state.prevDirection) && direction & directions && TILE_DIRECTIONS[fn(node).value ?? ""]
      );
      const newSeenForks = possibilities.length <= 1 ? state.seenForks : new Set([coord, ...state.seenForks]);
      for (const [direction, fn] of possibilities) {
        produceNode(new NodeWithState(fn(node), direction, newSeenForks), 1);
      }
    }
  },
  new NodeWithState(map.getNode(1, 0), SOUTH, new Set())
);

p(max);
