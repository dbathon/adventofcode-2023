import { Map2D, Map2DNode } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a21.txt");

const map = Map2D.fromLines(lines, (c) => c);

const starts = map.getNodes().filter((node) => node.value === "S");

function simulateWalk(starts: Map2DNode<string>[], steps: number): Map2DNode<string>[] {
  let currentNodes = starts;
  for (let i = 0; i < steps; i++) {
    const reachedNodes = new Map<string, Map2DNode<string>>();

    currentNodes.forEach((node) => {
      node.fourNeighbors
        .filter((node) => (node.value ?? "#") !== "#")
        .forEach((node) => reachedNodes.set(node.nodeKey, node));
    });

    currentNodes = [...reachedNodes.values()];
  }
  return currentNodes;
}

p(simulateWalk(starts, 64).length);
