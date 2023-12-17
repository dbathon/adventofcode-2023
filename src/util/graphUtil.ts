import { Heap } from "./util";

export interface Node {
  nodeKey: any;
}

export class Neighbor<N extends Node | string> {
  constructor(
    readonly node: N,
    readonly distance: number
  ) {}
}

export function dijkstraSearch<N extends Node | string>(
  getNeighbors: (node: N, distance: number) => Neighbor<N>[] | null,
  start: N
): void {
  class QueueEntry {
    constructor(
      readonly node: N,
      readonly distance: number
    ) {}
  }

  function getNodeKey<N extends Node | string>(node: N) {
    return typeof node === "string" ? node : (node as Node).nodeKey;
  }

  const queue = new Heap<QueueEntry>((a, b) => a.distance < b.distance);
  queue.insert(new QueueEntry(start, 0));

  const seen: Set<any> = new Set();

  while (queue.size > 0) {
    const entry = queue.remove();

    const node = entry.node;
    const nodeKey = getNodeKey(node);
    if (!seen.has(nodeKey)) {
      seen.add(nodeKey);

      const neighbors = getNeighbors(node, entry.distance);
      if (neighbors === null) {
        return;
      }

      neighbors.forEach((info) => {
        if (!seen.has(getNodeKey(info.node))) {
          queue.insert(new QueueEntry(info.node, entry.distance + info.distance));
        }
      });
    }
  }
}
