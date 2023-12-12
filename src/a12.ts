import { memoized, p, parseInts, readLines, sum } from "./util/util";

const lines = readLines("input/a12.txt");

const countArrangements: (pattern: string, lengths: number[]) => number = memoized((pattern, lengths) => {
  const [length, ...restLengths] = lengths;

  const firstUnbroken = pattern.indexOf("#");
  const maxStart = Math.min(firstUnbroken >= 0 ? firstUnbroken : pattern.length, pattern.length - length);
  let result = 0;
  outer: for (let i = 0; i <= maxStart; i++) {
    const charAfter = pattern.charAt(i + length);
    if (charAfter === "#") {
      continue;
    }
    for (let j = 0; j < length; j++) {
      if (pattern.charAt(i + j) === ".") {
        continue outer;
      }
    }
    const restPattern = pattern.substring(i + length + 1);
    if (restLengths.length) {
      result += countArrangements(restPattern, restLengths);
    } else {
      if (restPattern.indexOf("#") < 0) {
        ++result;
      }
    }
  }
  return result;
});

function parseAndCountArrangements(line: string): number {
  const [pattern, numbers] = line.split(" ");
  const lengths = parseInts(numbers, /,/);
  return countArrangements(pattern, lengths);
}

function unfold(line: string): string {
  return line.replace(/(\S+) (\S+)/, "$1?$1?$1?$1?$1 $2,$2,$2,$2,$2");
}

p(sum(lines.map(parseAndCountArrangements)));
p(sum(lines.map(unfold).map(parseAndCountArrangements)));
