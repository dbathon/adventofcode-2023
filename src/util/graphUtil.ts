import { Heap } from "./util";

export interface Node {
  nodeKey: any;
}

export function dijkstraSearch<N extends Node | string>(
  produceNodes: (node: N, distance: number, produceNode: (node: N, distance: number) => void) => boolean | void,
  start: N
): void {
  interface QueueEntry {
    readonly node: N;
    readonly nodeKey: any;
    readonly distance: number;
  }

  function getNodeKey<N extends Node | string>(node: N) {
    return typeof node === "string" ? node : (node as Node).nodeKey;
  }

  const queue = new Heap<QueueEntry>((a, b) => a.distance < b.distance);
  queue.insert({ node: start, nodeKey: getNodeKey(start), distance: 0 });

  const seen: Set<any> = new Set();

  while (queue.size > 0) {
    const { node, nodeKey, distance: oldDistance } = queue.remove();

    if (!seen.has(nodeKey)) {
      seen.add(nodeKey);

      const abort = produceNodes(node, oldDistance, (node, distance) => {
        const newNodeKey = getNodeKey(node);
        if (!seen.has(newNodeKey)) {
          queue.insert({ node, nodeKey: newNodeKey, distance: oldDistance + distance });
        }
      });
      if (abort) {
        return;
      }
    }
  }
}
