import { Neighbor, Node, dijkstraSearch } from "./util/graphUtil";
import { Map2D, Map2DNode } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a17.txt");

const NEIGHBOR_FUNCTIONS: ((node: Map2DNode<number>) => Map2DNode<number>)[] = [
  (node) => node.up,
  (node) => node.right,
  (node) => node.down,
  (node) => node.left,
];

const POSSIBLE_DIRECTIONS = NEIGHBOR_FUNCTIONS.map((_, direction) =>
  [0, 1, 3].map((rotation) => (direction + rotation) % 4)
);

const map: Map2D<number> = Map2D.fromLines(lines, (c) => parseInt(c));

const goalX = map.width - 1;
const goalY = map.height - 1;

class NodeWithState implements Node {
  constructor(
    readonly node: Map2DNode<number>,
    readonly lastDirection: number | undefined,
    readonly lastDirectionCount: number
  ) {}

  get nodeKey(): string {
    return this.node.nodeKey + ";" + this.lastDirection + ";" + this.lastDirectionCount;
  }
}

function getMinHeatLoss(minStepsOneDirection: number, maxStepsOneDirection: number): number {
  let heatLoss = -1;

  dijkstraSearch(
    (state: NodeWithState, distance) => {
      const node = state.node;
      if (node.x === goalX && node.y === goalY && state.lastDirectionCount >= minStepsOneDirection) {
        heatLoss = distance;
        return null;
      }
      const possibleDirections = POSSIBLE_DIRECTIONS[state.lastDirection ?? 1];
      const result: Neighbor<NodeWithState>[] = [];
      for (let direction = 0; direction < NEIGHBOR_FUNCTIONS.length; direction++) {
        if (
          state.lastDirection === undefined ||
          ((state.lastDirectionCount < maxStepsOneDirection || state.lastDirection !== direction) &&
            (state.lastDirectionCount >= minStepsOneDirection || state.lastDirection === direction) &&
            possibleDirections.includes(direction))
        ) {
          const next = NEIGHBOR_FUNCTIONS[direction](node);
          if (next.value !== undefined) {
            result.push(
              new Neighbor(
                new NodeWithState(
                  next,
                  direction,
                  direction === state.lastDirection ? state.lastDirectionCount + 1 : 1
                ),
                next.value
              )
            );
          }
        }
      }
      return result;
    },
    new NodeWithState(map.getNode(0, 0), undefined, 0)
  );

  return heatLoss;
}

p(getMinHeatLoss(0, 3));

p(getMinHeatLoss(4, 10));
