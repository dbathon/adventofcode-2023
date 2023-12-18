import { dijkstraSearch } from "./util/graphUtil";
import { Map2D } from "./util/map2D";
import { p, readLines } from "./util/util";

const lines = readLines("input/a18.txt");

const map = new Map2D<string>();

let pos = map.getNode(0, 0);

let count1 = 0;
for (const line of lines) {
  const [direction, countStr, color] = line.split(" ");
  const count = parseInt(countStr);
  for (let i = 0; i < count; i++) {
    switch (direction) {
      case "U":
        pos = pos.up;
        break;
      case "D":
        pos = pos.down;
        break;
      case "L":
        pos = pos.left;
        break;
      case "R":
        pos = pos.right;
        break;
      default:
        throw "error";
    }
    pos.value = "#";
    ++count1;
  }
}

const maxX = map.originX + map.width;
outer: for (let y = map.originY; ; y++) {
  for (let x = map.originX; x < maxX; x++) {
    if (map.get(x, y) === "#" && map.get(x - 1, y) !== "#") {
      const inside = map.getNode(x + 1, y);
      if (inside.value !== "#") {
        // we are inside, just do a flood fill...
        dijkstraSearch((node, distance, produceNode) => {
          ++count1;
          node.fourNeighbors.forEach((neighbor) => {
            if (neighbor.value !== "#") {
              produceNode(neighbor, 1);
            }
          });
        }, inside);
        break outer;
      }
    }
  }
}

p(count1);
