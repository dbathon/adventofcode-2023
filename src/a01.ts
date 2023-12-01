import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a01.txt");

const digits = "0123456789".split("");

p(
  sum(
    lines
      .map((line) => line.split("").filter((c) => digits.includes(c)))
      .map((e) => e.at(0)! + e.at(-1)!)
      .map((s) => parseInt(s))
  )
);

const digitMap: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

digits.forEach((d) => {
  digitMap[d] = parseInt(d);
});

p(
  sum(
    lines.map((line) => {
      const digits: number[] = [];
      for (let i = 0; i < line.length; ++i) {
        const rest = line.substring(i);
        for (const [str, digit] of Object.entries(digitMap)) {
          if (rest.startsWith(str)) {
            digits.push(digit);
            break;
          }
        }
      }

      return digits.at(0)! * 10 + digits.at(-1)!;
    })
  )
);
