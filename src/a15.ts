import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a15.txt");

const steps = lines[0].split(",");

function hash(s: string): number {
  return s.split("").reduce((current, c) => ((current + c.charCodeAt(0)) * 17) & 0xff, 0);
}

p(sum(steps.map(hash)));

const boxes: Map<string, number>[] = [];

for (const step of steps) {
  if (step.endsWith("-")) {
    const label = step.split("-")[0];
    boxes[hash(label)]?.delete(label);
  } else {
    const [label, focalLength] = step.split("=");
    const box = (boxes[hash(label)] ??= new Map());
    box.set(label, parseInt(focalLength));
  }
}

let sum2 = 0;
boxes.forEach((box, i) => {
  if (box) {
    [...box.entries()].forEach(([_, focalLength], j) => {
      sum2 += (i + 1) * (j + 1) * focalLength;
    });
  }
});

p(sum2);
