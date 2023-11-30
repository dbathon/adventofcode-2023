export class Node {
  constructor(readonly ruleName: string, readonly children: (string | Node)[]) {}

  toString(): string {
    return this.children.map((child) => child.toString()).join("");
  }
}

export class OneOrMore {
  constructor(readonly pattern: (string | RegExp)[]) {
    if (pattern.length === 0) {
      throw new Error("pattern needs at least one step");
    }
  }
}

export class Rule {
  constructor(readonly patterns: (string | RegExp | OneOrMore)[][]) {
    if (patterns.find((pattern) => pattern.length === 0) !== undefined) {
      throw new Error("patterns need at least one step");
    }
  }
}

class PartialResult {
  constructor(readonly nodes: (Node | string)[], readonly remaining: string) {}
}

class Possibility {
  constructor(
    readonly remaining: string,
    readonly children: (string | Node)[],
    readonly remainingPattern: (string | RegExp | OneOrMore)[]
  ) {}
}

function getRule(rules: Map<string, Rule>, ruleName: string) {
  const rule = rules.get(ruleName);
  if (rule === undefined) {
    throw new Error("rule not found: " + ruleName);
  }
  return rule;
}

function parseRecursive(
  string: string,
  rules: Map<string, Rule>,
  patternPart: string | RegExp | OneOrMore
): PartialResult[] {
  const result: PartialResult[] = [];
  if (typeof patternPart === "string") {
    const ruleName = patternPart;
    const rule = getRule(rules, ruleName);

    const possibilities = rule.patterns.map((pattern) => new Possibility(string, [], pattern));

    while (possibilities.length > 0) {
      const possibility = possibilities.shift()!;
      const newRemainingPattern = possibility.remainingPattern.slice(1);
      const step = possibility.remainingPattern[0];
      for (const partialResult of parseRecursive(possibility.remaining, rules, step)) {
        const newPossibility = new Possibility(
          partialResult.remaining,
          [...possibility.children, ...partialResult.nodes],
          newRemainingPattern
        );
        if (newPossibility.remainingPattern.length === 0) {
          const partialResult = new PartialResult(
            [new Node(ruleName, newPossibility.children)],
            newPossibility.remaining
          );
          if (partialResult.remaining.length === 0) {
            // we found a full match, just return it
            return [partialResult];
          }
          result.push(partialResult);
        } else {
          possibilities.push(newPossibility);
        }
      }
    }
  } else if (patternPart instanceof OneOrMore) {
    const oneOrMore = patternPart;
    const possibilities = [new Possibility(string, [], oneOrMore.pattern)];
    while (possibilities.length > 0) {
      const possibility = possibilities.shift()!;
      const newRemainingPattern = possibility.remainingPattern.slice(1);
      const step = possibility.remainingPattern[0];
      parseRecursive(possibility.remaining, rules, step).forEach((partialResult) => {
        const newPossibility = new Possibility(
          partialResult.remaining,
          [...possibility.children, ...partialResult.nodes],
          newRemainingPattern
        );
        if (newPossibility.remainingPattern.length === 0) {
          result.push(new PartialResult(newPossibility.children, newPossibility.remaining));
          // and also try matching the pattern again
          possibilities.push(new Possibility(newPossibility.remaining, newPossibility.children, oneOrMore.pattern));
        } else {
          possibilities.push(newPossibility);
        }
      });
    }
  } else {
    const regExp = patternPart;
    regExp.lastIndex = 0;
    const match = regExp.exec(string);
    if (match && match.index === 0 && match[0].length > 0) {
      result.push(new PartialResult([match[0]], string.substring(match[0].length)));
    }
  }
  return result;
}

function isLeftRecursive(
  startRuleName: string,
  checkRule: Rule,
  rules: Map<string, Rule>,
  checked = new Set<string>()
): boolean {
  return (
    checkRule.patterns.find((pattern) => {
      let firstStep = pattern[0];
      if (firstStep instanceof OneOrMore) {
        firstStep = firstStep.pattern[0];
      }
      if (typeof firstStep === "string") {
        if (firstStep === startRuleName) {
          return true;
        }
        if (!checked.has(firstStep)) {
          checked.add(firstStep);
          try {
            if (isLeftRecursive(startRuleName, getRule(rules, firstStep), rules, checked)) {
              return true;
            }
          } finally {
            checked.delete(firstStep);
          }
        }
      }
      return false;
    }) !== undefined
  );
}

/**
 * Tries to find a parse tree that matches the given string completely with the given rules.
 *
 * If there are multiple potential parse trees, then only one of them is returned.
 *
 * This is not the most efficient way to do the parsing, but it is simple...
 */
export function parse(string: string, rules: Map<string, Rule>, startRuleName: string): Node | undefined {
  rules.forEach((rule, name) => {
    if (isLeftRecursive(name, rule, rules)) {
      // left recursive grammars are currently not supported
      throw new Error("left recursive rules are not supported: " + name);
    }
  });
  const result = parseRecursive(string, rules, startRuleName).find(
    (partialResult) => partialResult.remaining.length === 0
  );
  return result && !(typeof result.nodes[0] === "string") ? result.nodes[0] : undefined;
}
