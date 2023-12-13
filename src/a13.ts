import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a13.txt", true, false);

const patterns: string[][] = [];

let currentPattern: string[] = [];

for (const line of lines) {
  if (line.length) {
    currentPattern.push(line);
  } else if (currentPattern.length) {
    patterns.push(currentPattern);
    currentPattern = [];
  }
}

function flip(pattern: string[]): string[] {
  return pattern[0].split("").map((_, i) => pattern.map((line) => line.charAt(i)).join(""));
}

function findReflection(pattern: string[], start: number): number | undefined {
  outer: for (let i = start; i < pattern.length; i++) {
    if (pattern[i - 1] === pattern[i]) {
      for (let j = 2; i - j >= 0 && i + j - 1 < pattern.length; j++) {
        if (pattern[i - j] !== pattern[i + j - 1]) {
          continue outer;
        }
      }
      return i;
    }
  }
  return undefined;
}

function reflectionScores(pattern: string[]): number[] {
  const result: number[] = [];
  const flippedPattern = flip(pattern);
  let vertical = findReflection(flippedPattern, 1);
  while (vertical) {
    result.push(vertical);
    vertical = findReflection(flippedPattern, vertical + 1);
  }
  let horizontal = findReflection(pattern, 1);
  while (horizontal) {
    result.push(horizontal * 100);
    horizontal = findReflection(pattern, horizontal + 1);
  }
  return result;
}

p(sum(patterns.map((pattern) => reflectionScores(pattern)[0])));

p(
  sum(
    patterns.map((pattern) => {
      const originalScore = reflectionScores(pattern)[0];
      const height = pattern.length;
      const width = pattern[0].length;
      // brute force ;)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const modified = [...pattern];
          const l = modified[y];
          modified[y] = l.substring(0, x) + (l.charAt(x) == "#" ? "." : "#") + l.substring(x + 1);
          for (const score of reflectionScores(modified)) {
            if (score !== originalScore) {
              return score;
            }
          }
        }
      }
      throw "error";
    })
  )
);
