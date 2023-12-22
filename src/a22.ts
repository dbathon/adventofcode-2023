import { p, readLines } from "./util/util";

const lines = readLines("input/a22.txt");

interface Point {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

function parsePoint(s: string): Point {
  const [x, y, z] = s.split(",").map((s) => parseInt(s));
  return { x, y, z };
}

class Brick {
  readonly from: Point;
  readonly to: Point;

  constructor(p1: Point, p2: Point) {
    // make sure "from" is always lower or equal than "to"
    if (p2.x < p1.x || p2.y < p1.y || p2.z < p1.z) {
      throw "error";
    }
    this.from = p1;
    this.to = p2;
  }

  static parse(line: string): Brick {
    const [p1, p2] = line.split("~").map(parsePoint);
    return new Brick(p1, p2);
  }

  getCoords(): string[] {
    const result: string[] = [];
    for (let x = this.from.x; x <= this.to.x; x++) {
      for (let y = this.from.y; y <= this.to.y; y++) {
        for (let z = this.from.z; z <= this.to.z; z++) {
          result.push(x + ";" + y + ";" + z);
        }
      }
    }
    return result;
  }

  drop(distance: number): Brick {
    const newFrom: Point = { ...this.from, z: this.from.z - distance };
    const newTo: Point = { ...this.to, z: this.to.z - distance };
    return new Brick(newFrom, newTo);
  }
}

function findDroppingBrick(bricks: Set<Brick>, minZ = 1): { brick: Brick; distance: number } | undefined {
  const sortedBricks = [...bricks].sort((a, b) => a.from.z - b.from.z);
  const allCoords = new Set(sortedBricks.flatMap((b) => b.getCoords()));
  let result: { brick: Brick; distance: number } | undefined = undefined;
  for (const brick of sortedBricks) {
    if (brick.from.z > 1 && brick.from.z >= minZ) {
      const coords = brick.getCoords();
      coords.forEach((coord) => allCoords.delete(coord));

      for (let i = 1; brick.from.z - i >= 1; i++) {
        if (
          brick
            .drop(i)
            .getCoords()
            .every((coord) => !allCoords.has(coord))
        ) {
          result = { brick, distance: i };
        } else {
          break;
        }
      }
      if (result) {
        return result;
      }

      // add the original coords again
      coords.forEach((coord) => allCoords.add(coord));
    }
  }

  return undefined;
}

const bricks = new Set(lines.map(Brick.parse));

function settleBricks(bricks: Set<Brick>): number {
  const droppedBricks = new Set<Brick>();
  let minZ = 1;
  while (true) {
    const result = findDroppingBrick(bricks, minZ);
    if (!result) {
      break;
    }
    minZ = result.brick.from.z;
    bricks.delete(result.brick);
    droppedBricks.delete(result.brick);
    const droppedBrick = result.brick.drop(result.distance);
    bricks.add(droppedBrick);
    droppedBricks.add(droppedBrick);
  }
  return droppedBricks.size;
}

settleBricks(bricks);

let count1 = 0;
let sum2 = 0;

for (const brick of [...bricks]) {
  bricks.delete(brick);
  if (!findDroppingBrick(bricks)) {
    ++count1;
  } else {
    sum2 += settleBricks(new Set(bricks));
  }
  bricks.add(brick);
}

p(count1);
p(sum2);
