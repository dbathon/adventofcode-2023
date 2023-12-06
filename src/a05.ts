import { findMax, p, parseInts, readLines } from "./util/util";

const lines = readLines("input/a05.txt");

interface RangeMapping {
  destStart: number;
  sourceStart: number;
  length: number;
}

interface Mappings {
  to: string;
  ranges: RangeMapping[];
}

const seeds: number[] = [];

const mappingsMap = new Map<string, Mappings>();
let currentMappings: Mappings | undefined = undefined;

for (const line of lines) {
  if (line.length) {
    if (line.startsWith("seeds:")) {
      seeds.push(...parseInts(line.split(":")[1]));
    } else {
      const match = /(\w+)-to-(\w+) map:/.exec(line);
      if (match) {
        currentMappings = {
          to: match[2],
          ranges: [],
        };
        mappingsMap.set(match[1], currentMappings);
      } else {
        const [destStart, sourceStart, length] = parseInts(line);
        currentMappings!.ranges.push({ destStart, sourceStart, length });
      }
    }
  }
}

let currentValues = seeds;
for (let type = "seed"; type !== "location"; type = mappingsMap.get(type)!.to) {
  const ranges = mappingsMap.get(type)!.ranges;
  currentValues = currentValues.map((value) => {
    for (const range of ranges) {
      if (value >= range.sourceStart && value < range.sourceStart + range.length) {
        return range.destStart + (value - range.sourceStart);
      }
    }
    return value;
  });
}
p(findMax(currentValues, (n) => -n).maxElement);

interface Range {
  start: number;
  length: number;
}

const seedRanges: Range[] = [];
for (let i = 0; i < seeds.length; i += 2) {
  seedRanges.push({ start: seeds[i], length: seeds[i + 1] });
}

let currentRanges = seedRanges;
for (let type = "seed"; type !== "location"; type = mappingsMap.get(type)!.to) {
  // sort the mappings, the algorithm below depends on it
  const mappings = [...mappingsMap.get(type)!.ranges].sort((a, b) => a.sourceStart - b.sourceStart);
  currentRanges = currentRanges.flatMap((originalRange) => {
    const result: Range[] = [];
    const current: Range = { ...originalRange };
    for (const mapping of mappings) {
      const mappingEnd = mapping.sourceStart + mapping.length;

      if (current.start + current.length > mapping.sourceStart && current.start < mappingEnd) {
        // split of a new range from before the mapping if necessary
        if (current.start < mapping.sourceStart) {
          const newLength = mapping.sourceStart - current.start;
          result.push({ start: current.start, length: newLength });
          current.start = mapping.sourceStart;
          current.length -= newLength;
        }

        const mapOffset = current.start - mapping.sourceStart;
        const mapLength = Math.min(current.length, mapping.length - mapOffset);

        result.push({
          start: mapping.destStart + mapOffset,
          length: mapLength,
        });

        current.start += mapLength;
        current.length -= mapLength;
        if (current.length <= 0) {
          break;
        }
      }
    }
    if (current.length > 0) {
      result.push(current);
    }
    return result;
  });
}
p(findMax(currentRanges, (r) => -r.start).maxElement!.start);
