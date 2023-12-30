import { Expression, e, findSolution } from "./util/equation";
import { solveSystemOfLinearEquations } from "./util/linearEquations";
import { q } from "./util/rational";
import { p, parseInts, readLines } from "./util/util";

const lines = readLines("input/a24.txt");

type Vector = [number, number, number];
type Path = { p: Vector; v: Vector };

const paths: Path[] = lines.map((line) => {
  const [pos, velocity] = line.split(" @ ");
  const [px, py, pz] = parseInts(pos, /, /);
  const [vx, vy, vz] = parseInts(velocity, /, /);
  return { p: [px, py, pz], v: [vx, vy, vz] };
});

let count1 = 0;
const ZERO = q(0);
const MIN = q(200000000000000);
const MAX = q(400000000000000);

for (let i = 0; i < paths.length; i++) {
  const path1 = paths[i];
  for (let j = i + 1; j < paths.length; j++) {
    const path2 = paths[j];
    const coefficientRows = [
      [q(path1.v[0]), q(-path2.v[0])],
      [q(path1.v[1]), q(-path2.v[1])],
    ];
    const constants = [q(path2.p[0] - path1.p[0]), q(path2.p[1] - path1.p[1])];

    const solution = solveSystemOfLinearEquations(coefficientRows, constants);

    const expressions = [
      e("+", e("*", path1.v[0], "a"), e("*", -path2.v[0], "b"), path1.p[0], -path2.p[0]),
      e("+", e("*", path1.v[1], "a"), e("*", -path2.v[1], "b"), path1.p[1], -path2.p[1]),
    ];
    const solution2 = findSolution(expressions);
    if (
      !!solution !== !!solution2 ||
      (solution && solution2 && (!solution[0].equals(solution2.get("a")!) || !solution[1].equals(solution2?.get("b")!)))
    ) {
      throw "error";
    }
    if (solution && solution.every((v) => !v.lessThan(ZERO))) {
      if (
        [0, 1].every((j) => {
          const intersection = q(path1.p[j]).add(solution[0].multiply(q(path1.v[j])));
          return !(intersection.lessThan(MIN) || MAX.lessThan(intersection));
        })
      ) {
        ++count1;
      }
    }
  }
}

p(count1);

// part 2
// create one large system of equations
// the first 3 unknowns are the start of the throw
// the next 3 unknowns are the direction of the throw
// and then one unknown for each intersection time

const equations: Expression[] = [];
const symbols = new Set<string>();
paths.slice(0, 6).forEach((path, i) => {
  // each path contributes 3 equations
  for (let j = 0; j < 3; j++) {
    symbols.add("p" + j);
    symbols.add("v" + j);
    symbols.add("t" + i);
    equations.push(e("+", "p" + j, e("*", "t" + i, "v" + j), -path.p[j], e("*", "t" + i, -path.v[j])));
  }
});

p("Solve part 2 with https://live.sympy.org/ ...:");

p([...symbols].join(", ") + ", s = symbols('" + [...symbols].join(" ") + " s')");
p(
  "solve([" +
    equations.map((e) => e.toString()).join(", ") +
    ", p0 + p1 + p2 - s], [s, " +
    [...symbols].join(", ") +
    "], dict=True)"
);

// const solution = findSolution(equations);
