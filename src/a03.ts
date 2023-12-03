import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a03.txt");

const PATTERN = /[0-9]+|[^0-9\.]/g;

class CandidateNumber {
  constructor(readonly partNumber: number) {}
}

function coord(x: number, y: number): string {
  return x + "," + y;
}

const coordToCandidateNumber = new Map<string, CandidateNumber>();
const symbolCoordNeighbors: string[] = [];
const gearCoordNeighbors: string[][] = [];

lines.forEach((line, y) => {
  for (const match of line.matchAll(PATTERN)) {
    const x = match.index!;
    const str = match[0];
    const num = parseInt(str);
    if (num === num) {
      const partNumber = new CandidateNumber(num);
      for (let i = 0; i < str.length; i++) {
        coordToCandidateNumber.set(coord(x + i, y), partNumber);
      }
    } else {
      const coords = [
        coord(x - 1, y - 1),
        coord(x - 1, y - 0),
        coord(x - 1, y + 1),
        coord(x, y - 1),
        coord(x, y + 1),
        coord(x + 1, y - 1),
        coord(x + 1, y - 0),
        coord(x + 1, y + 1),
      ];
      symbolCoordNeighbors.push(...coords);
      if (str === "*") {
        gearCoordNeighbors.push(coords);
      }
    }
  }
});

function findRealPartNumbers(coords: string[]): CandidateNumber[] {
  const partNumbers = new Set<CandidateNumber>();

  coords.forEach((coord) => {
    const candidate = coordToCandidateNumber.get(coord);
    if (candidate) {
      partNumbers.add(candidate);
    }
  });
  return [...partNumbers];
}

p(sum(findRealPartNumbers(symbolCoordNeighbors).map((c) => c.partNumber)));

p(
  sum(
    gearCoordNeighbors.map((neighborCoords) => {
      const partNumbers = findRealPartNumbers(neighborCoords);
      if (partNumbers.length === 2) {
        const [p1, p2] = partNumbers;
        return p1.partNumber * p2.partNumber;
      }
      return 0;
    })
  )
);
