import { p, readLines } from "./util/util";

const lines = readLines("input/a04.txt");

let sum1 = 0;

const part2Counts: number[] = [];
let sum2 = 0;

lines.forEach((line, i) => {
  const [winningNumbers, allNumbers] = line
    .split(":")[1]
    .trim()
    .split("|")
    .map((strings) =>
      strings
        .trim()
        .split(/ +/)
        .map((s) => parseInt(s))
    );

  const matches = allNumbers.filter((n) => winningNumbers.includes(n)).length;
  sum1 += matches === 0 ? 0 : 1 << (matches - 1);

  const currentCardCount = part2Counts[i] ?? 1;
  sum2 += currentCardCount;
  for (let j = 1; j <= matches; j++) {
    part2Counts[i + j] = (part2Counts[i + j] ?? 1) + currentCardCount;
  }
});

p(sum1);

p(sum2);
