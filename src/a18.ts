import { p, readLines } from "./util/util";

const lines = readLines("input/a18.txt");

const NORTH = 0b0001;
const EAST = 0b0010;
const SOUTH = 0b0100;
const WEST = 0b1000;

const NORTH_SOUTH = NORTH | SOUTH;

function buildMap(instructions: string[]): Map<number, Map<number, number>> {
  // y -> x -> directions
  const result = new Map<number, Map<number, number>>();
  let x = 0;
  let y = 0;
  function addDirection(x: number, y: number, direction: number) {
    const rowMap = result.get(y) ?? new Map<number, number>();
    result.set(y, rowMap);
    rowMap.set(x, (rowMap.get(x) ?? 0) | direction);
  }
  for (const instruction of instructions) {
    const [direction, distanceStr] = instruction.split(" ");
    const distance = parseInt(distanceStr);
    switch (direction) {
      case "U":
        addDirection(x, y, NORTH);
        y -= distance;
        addDirection(x, y, SOUTH);
        break;
      case "D":
        addDirection(x, y, SOUTH);
        y += distance;
        addDirection(x, y, NORTH);
        break;
      case "L":
        addDirection(x, y, WEST);
        x -= distance;
        addDirection(x, y, EAST);
        break;
      case "R":
        addDirection(x, y, EAST);
        x += distance;
        addDirection(x, y, WEST);
        break;
      default:
        throw "error";
    }
  }

  return result;
}

function calculateVolume(map: Map<number, Map<number, number>>): number {
  let volume = 0;
  // x coordinates of vertical walls after the current row
  const walls = new Set<number>();
  const ys = [...map.keys()].sort((a, b) => a - b);
  let prevY: number | undefined = undefined;
  for (const y of ys) {
    if (prevY !== undefined && walls.size) {
      // calculate the volume in between
      const height = y - prevY - 1;
      if (height > 0) {
        let widthInside = 0;
        const wallsSorted = [...walls].sort((a, b) => a - b);
        for (let i = 0; i < wallsSorted.length; i += 2) {
          widthInside += wallsSorted[i + 1] - wallsSorted[i] + 1;
        }
        volume += height * widthInside;
      }
    }

    const rowMap = map.get(y)!;
    const xs = [...new Set([...rowMap.keys(), ...walls])].sort((a, b) => a - b);
    let insideStart: number | undefined = undefined;
    let seenVertical = 0;
    for (const x of xs) {
      // if x is not in the map, then it is a continuing wall
      const directions = rowMap.get(x) ?? NORTH_SOUTH;
      // update walls if necessary
      if (directions !== NORTH_SOUTH) {
        if (directions & NORTH) {
          // wall ends
          walls.delete(x);
        }
        if (directions & SOUTH) {
          // wall start
          walls.add(x);
        }
      }

      // calculate the volume in the current row
      if (directions) {
        const northSouthDirections = directions & NORTH_SOUTH;
        if (northSouthDirections) {
          seenVertical ^= northSouthDirections;
          if (seenVertical > 0 && insideStart === undefined) {
            insideStart = x;
          } else if (seenVertical === 0 && insideStart !== undefined) {
            volume += x - insideStart + 1;
            insideStart = undefined;
          }
        }
      }
    }
    prevY = y;
  }

  return volume;
}

p(calculateVolume(buildMap(lines)));

const DIRECTIONS = ["R", "D", "L", "U"];
function extractInstructionsFromColors(lines: string[]): string[] {
  return lines.map((line) => {
    const hex = line.split("#")[1].substring(0, 6);
    return DIRECTIONS[parseInt(hex.charAt(5))] + " " + parseInt(hex.substring(0, 5), 16);
  });
}

p(calculateVolume(buildMap(extractInstructionsFromColors(lines))));
