import { p, parseInts, readLines } from "./util/util";

const lines = readLines("input/a06.txt");

function dist(holdMillis: number, millis: number): number {
  return (millis - holdMillis) * holdMillis;
}

function calculateMargin(times: number[], records: number[]): number {
  let product = 1;
  times.forEach((millis, i) => {
    const record = records[i];
    let cnt = 0;
    for (let i = 1; i < millis; i++) {
      if (dist(i, millis) > record) {
        ++cnt;
      }
    }
    product *= cnt;
  });
  return product;
}

p(calculateMargin(parseInts(lines[0].split(":")[1]), parseInts(lines[1].split(":")[1])));

p(
  calculateMargin(
    parseInts(lines[0].split(":")[1].replaceAll(" ", "")),
    parseInts(lines[1].split(":")[1].replaceAll(" ", ""))
  )
);
