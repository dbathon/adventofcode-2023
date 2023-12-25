import { Node, dijkstraSearch } from "./util/graphUtil";
import { findMax, p, readLines } from "./util/util";

const lines = readLines("input/a25.txt");

const nodeToEdges = new Map<string, Map<string, string>>();

function getEdges(from: string): Map<string, string> {
  const edges = nodeToEdges.get(from) ?? new Map();
  nodeToEdges.set(from, edges);
  return edges;
}

lines.forEach((line) => {
  const [from, ...tos] = line.split(/:? /);
  const edges = getEdges(from);
  for (const to of tos) {
    const edgeName = from + "-" + to;
    edges.set(edgeName, to);
    getEdges(to).set(edgeName, from);
  }
});

const nodes = [...nodeToEdges.keys()];

interface EdgeWithPrev extends Node {
  nodeKey: string;
  edge?: string;
  prev?: EdgeWithPrev;
}

function findMostUsedEdge(blacklist: Set<string>): { reachCounts: number[]; mostUsed: string | undefined } {
  const useCount = new Map<string, number>();
  let reachCounts = new Set<number>();

  for (const startNode of nodes) {
    const reached: EdgeWithPrev[] = [];

    dijkstraSearch(
      (node: EdgeWithPrev, _, produceNode) => {
        reached.push(node);
        for (const [edge, to] of nodeToEdges.get(node.nodeKey)?.entries() ?? []) {
          if (!blacklist.has(edge)) {
            produceNode({ nodeKey: to, edge, prev: node }, 1);
          }
        }
      },
      { nodeKey: startNode }
    );

    reachCounts.add(reached.length);

    for (const node of reached) {
      let current: EdgeWithPrev | undefined = node;
      while (current && current.edge) {
        useCount.set(current.edge, (useCount.get(current.edge) ?? 0) + 1);
        current = current.prev;
      }
    }
  }

  return {
    reachCounts: [...reachCounts],
    mostUsed: findMax([...useCount.entries()], (e) => e[1]).maxElement?.[0],
  };
}

const blacklist = new Set<string>();

while (true) {
  const { reachCounts, mostUsed } = findMostUsedEdge(blacklist);
  if (reachCounts.length === 1) {
    blacklist.add(mostUsed!);
  } else {
    p(reachCounts.reduce((a, b) => a * b, 1));
    break;
  }
}
