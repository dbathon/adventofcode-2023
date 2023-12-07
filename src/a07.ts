import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a07.txt");

function orderFunction1(hand: string): string {
  const counts: Record<string, number> = {};
  hand.split("").forEach((c) => (counts[c] = (counts[c] ?? 0) + 1));
  const part1 = Object.values(counts)
    .map((n) => "" + n)
    .sort()
    .reverse()
    .join("");

  // replace letters, so that the ordering by the default string order works
  const part2 = hand
    .replaceAll("A", "E")
    .replaceAll("K", "D")
    .replaceAll("Q", "C")
    .replaceAll("J", "B")
    .replaceAll("T", "A");

  return part1 + part2;
}

function orderFunction2(hand: string): string {
  const counts: Record<string, number> = {};
  hand.split("").forEach((c) => (counts[c] = (counts[c] ?? 0) + 1));
  const jokers = counts.J ?? 0;
  delete counts.J;
  const part1 = Object.values(counts)
    .map((n) => "" + n)
    .sort()
    .reverse()
    .join("");
  const part1Modified = jokers === 5 ? "5" : parseInt(part1.charAt(0)) + jokers + part1.substring(1);

  // replace letters, so that the ordering by the default string order works
  const part2 = hand
    .replaceAll("A", "E")
    .replaceAll("K", "D")
    .replaceAll("Q", "C")
    .replaceAll("J", "1")
    .replaceAll("T", "A");

  return part1Modified + part2;
}

function calculateTotalWinnings(orderFunction: (hand: string) => string): number {
  return sum(
    lines
      .map((line) => {
        return orderFunction(line.split(" ")[0]) + line;
      })
      .sort()
      .map((s, i) => {
        return (i + 1) * parseInt(s.split(" ")[1]);
      })
  );
}

p(calculateTotalWinnings(orderFunction1));
p(calculateTotalWinnings(orderFunction2));
