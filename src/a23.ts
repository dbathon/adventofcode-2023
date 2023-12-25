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

interface Edge {
  node: string;
  distance: number;
}

function buildGraph(map: Map2D<string>): Record<string, Edge[]> {
  const goalY = map.height - 1;
  const graph: Record<string, Edge[]> = {};
  const nodeQueue = [map.getNode(1, 0)];

  function getPossibilities(
    node: Map2DNode<string>,
    forbiddenDirection: number
  ): [number, (node: Map2DNode<string>) => Map2DNode<string>][] {
    const directions = TILE_DIRECTIONS[node.value ?? ""];
    if (!directions) {
      return [];
    }
    return DIRECTION_TO_NEIGHBOR_FUNCTIONS.filter(
      ([direction, fn]) =>
        direction !== forbiddenDirection && direction & directions && TILE_DIRECTIONS[fn(node).value ?? ""]
    );
  }

  while (nodeQueue.length) {
    const node = nodeQueue.shift()!;
    const nodeKey = node.nodeKey;

    const initialPossibilities = getPossibilities(node, 0);
    outer: for (const [direction, fn] of initialPossibilities) {
      // walk until there are multiple options again or the goal is reached
      let distance = 1;
      let lastNode = fn(node);
      let lastDirection = direction;
      while (true) {
        if (lastNode.y === goalY) {
          (graph[nodeKey] ||= []).push({ node: "goal", distance });
          continue outer;
        }
        const possibilities = getPossibilities(lastNode, opposite(lastDirection));
        if (possibilities.length === 0) {
          // dead end
          continue outer;
        } else if (possibilities.length === 1) {
          const [direction, fn] = possibilities[0];
          lastNode = fn(lastNode);
          lastDirection = direction;
          ++distance;
        } else {
          break;
        }
      }

      const lastNodeKey = lastNode.nodeKey;
      (graph[nodeKey] ||= []).push({ node: lastNodeKey, distance });
      if (!graph[lastNodeKey]) {
        graph[lastNodeKey] = [];
        nodeQueue.push(lastNode);
      }
    }
  }

  return graph;
}

function findLongestHike(map: Map2D<string>): number {
  const graph = buildGraph(map);
  const seen = new Set<string>();
  let max = 0;

  // recursive depth first search
  function search(node: string, distance: number) {
    if (seen.has(node)) {
      return;
    }
    if (node === "goal") {
      if (distance > max) {
        max = distance;
      }
      return;
    }
    const edges = graph[node];
    if (edges) {
      seen.add(node);
      edges.forEach((edge) => {
        search(edge.node, distance + edge.distance);
      });
      seen.delete(node);
    }
  }

  search("1;0", 0);
  return max;
}

p(findLongestHike(map));

map.forEachNode((node) => {
  if (TILE_DIRECTIONS[node.value ?? ""]) {
    node.value = ".";
  }
});

p(findLongestHike(map));
