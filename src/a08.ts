import { lcm, p, readLines } from "./util/util";

const lines = readLines("input/a08.txt");

const instructions: (0 | 1)[] = [];

const nodes: Record<string, [string, string]> = {};

for (const line of lines) {
  if (line.length) {
    const match = /(\w+) = \((\w+), (\w+)\)/.exec(line);
    if (match) {
      nodes[match[1]] = [match[2], match[3]];
    } else {
      instructions.push(...line.split("").map((c) => (c === "L" ? 0 : 1)));
    }
  }
}

{
  let current = "AAA";
  let step = 0;
  for (; current !== "ZZZ"; ++step) {
    current = nodes[current][instructions[step % instructions.length]];
  }
  p(step);
}

let part2Lcm = 1;
for (const node of Object.keys(nodes).filter((n) => n.endsWith("A"))) {
  const seen: Record<string, number> = {};
  let current = node;
  let step = 0;
  for (; ; ++step) {
    const instructionIndex = step % instructions.length;
    if (current.endsWith("Z")) {
      const key = current + "-" + instructionIndex;
      const lastSeen = seen[key];
      if (lastSeen !== undefined) {
        if (instructionIndex !== 0 || step !== lastSeen * 2) {
          // we only handle loops starting at 0
          throw "unexpected";
        }
        part2Lcm = lcm(part2Lcm, lastSeen);
        break;
      }
      seen[key] = step;
    }

    current = nodes[current][instructions[instructionIndex]];
  }
}

p(part2Lcm);
