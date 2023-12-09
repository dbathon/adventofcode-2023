import { p, parseInts, readLines, sum } from "./util/util";

const lines = readLines("input/a09.txt");

function predict(numbers: number[]): number {
  if (numbers.every((n) => n === 0)) {
    return 0;
  }
  const diff: number[] = [];
  for (let i = 1; i < numbers.length; i++) {
    diff.push(numbers[i] - numbers[i - 1]);
  }
  return numbers.at(-1)! + predict(diff);
}

p(sum(lines.map((line) => predict(parseInts(line)))));

p(sum(lines.map((line) => predict(parseInts(line).reverse()))));
