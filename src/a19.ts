import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a19.txt");

type Rating = Record<string, number>;

class InclusiveRange {
  constructor(
    readonly from: number,
    readonly to: number
  ) {
    if (this.size <= 0) {
      throw "error";
    }
  }

  get size(): number {
    return this.to - this.from + 1;
  }

  intersect(other: InclusiveRange): InclusiveRange | undefined {
    if (this.to < other.from || other.to < this.from) {
      return undefined;
    }
    return new InclusiveRange(Math.max(this.from, other.from), Math.min(this.to, other.to));
  }
}

interface RangeRule {
  readonly category: string;
  readonly range: InclusiveRange;
  readonly negatedRange: InclusiveRange;
  readonly nextName: string;
}

interface Workflow {
  readonly name: string;
  readonly rules: ((rating: Rating) => string | void)[];
  readonly rangeRules: RangeRule[];
}

const ratings: Rating[] = [];
const workflows = new Map<string, Workflow>();

for (const line of lines) {
  if (line.startsWith("{")) {
    ratings.push(JSON.parse(line.replaceAll("=", ":").replaceAll(/([a-z]+)/gi, '"$1"')));
  } else if (line.length) {
    const [name, rest] = line.split("{");
    const rules: ((rating: Rating) => string | void)[] = [];
    const rangeRules: RangeRule[] = [];
    rest.split(",").forEach((part) => {
      if (part.endsWith("}")) {
        const nextName = part.substring(0, part.length - 1);
        rules.push(() => nextName);
        rangeRules.push({
          category: "x",
          range: new InclusiveRange(1, 4000),
          negatedRange: new InclusiveRange(-1, -1),
          nextName,
        });
      } else {
        const [condition, nextName] = part.split(":");
        const match = /(\w+)([<>])(\d+)/.exec(condition);
        if (!match) {
          throw "error";
        }
        const category = match[1];
        const value = parseInt(match[3]);
        if (match[2] === ">") {
          rules.push((ratings) => (ratings[category] > value ? nextName : undefined));
          rangeRules.push({
            category,
            range: new InclusiveRange(value + 1, 4000),
            negatedRange: new InclusiveRange(0, value),
            nextName,
          });
        } else {
          rules.push((ratings) => (ratings[category] < value ? nextName : undefined));
          rangeRules.push({
            category,
            range: new InclusiveRange(1, value - 1),
            negatedRange: new InclusiveRange(value, 4000),
            nextName,
          });
        }
      }
    });

    workflows.set(name, { name, rules, rangeRules });
  }
}

function isAccepted(rating: Rating): boolean {
  let current: string | void = "in";
  while (true) {
    const workflow = workflows.get(current!);
    if (!workflow) {
      return current === "A";
    }
    for (const rule of workflow.rules) {
      current = rule(rating);
      if (current !== undefined) {
        break;
      }
    }
  }
}

p(sum(ratings.filter(isAccepted).map((rating) => sum(Object.values(rating)))));

type RangedRating = Record<string, InclusiveRange>;

const rangedRatings: RangedRating[] = [];

function walkWorkFlows(name: string, rangedRating: RangedRating): void {
  if (name === "A") {
    rangedRatings.push(rangedRating);
  } else {
    const workflow = workflows.get(name);
    let remaining = { ...rangedRating };
    if (workflow) {
      for (const rule of workflow.rangeRules) {
        const oldRange = remaining[rule.category];
        const intersection = rule.range.intersect(oldRange);
        if (intersection) {
          const newRangedRating: RangedRating = {
            ...remaining,
            [rule.category]: intersection,
          };
          walkWorkFlows(rule.nextName, newRangedRating);
        }
        const negatedIntersection = rule.negatedRange.intersect(oldRange);
        if (negatedIntersection) {
          remaining = {
            ...remaining,
            [rule.category]: negatedIntersection,
          };
        } else {
          return;
        }
      }
    }
  }
}

const FULL_RANGE = new InclusiveRange(1, 4000);
walkWorkFlows("in", { x: FULL_RANGE, m: FULL_RANGE, a: FULL_RANGE, s: FULL_RANGE });

p(
  sum(
    rangedRatings.map((r) =>
      Object.values(r)
        .map((r) => r.size)
        .reduce((a, b) => a * b, 1)
    )
  )
);
