import { p, parseInts, readLines } from "./util/util";

const lines = readLines("input/a24.txt");

class Vector2 {
  constructor(
    readonly x: number,
    readonly y: number
  ) {}

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multiply(factor: number): Vector2 {
    return new Vector2(this.x * factor, this.y * factor);
  }

  cross(other: Vector2): number {
    return this.x * other.y - this.y * other.x;
  }
}

class Path2 {
  constructor(
    readonly p: Vector2,
    readonly v: Vector2
  ) {}

  intersectionInFuture(other: Path2): Vector2 | undefined {
    const crossV = this.v.cross(other.v);
    if (crossV === 0) {
      return undefined;
    }
    const posDiff = other.p.subtract(this.p);
    const a = posDiff.cross(other.v) / crossV;
    const b = posDiff.cross(this.v) / crossV;
    if (a < 0 || b < 0) {
      return undefined;
    }
    return this.p.add(this.v.multiply(a));
  }
}

const paths = lines.map((line) => {
  const [pos, velocity] = line.split(" @ ");
  const [px, py] = parseInts(pos, /, /);
  const [vx, vy] = parseInts(velocity, /, /);
  return new Path2(new Vector2(px, py), new Vector2(vx, vy));
});

let count1 = 0;

for (let i = 0; i < paths.length; i++) {
  for (let j = i + 1; j < paths.length; j++) {
    const intersection = paths[i].intersectionInFuture(paths[j]);
    if (intersection) {
      if ([intersection.x, intersection.y].every((n) => n >= 200000000000000 && n <= 400000000000000)) {
        ++count1;
      }
    }
  }
}

p(count1);
