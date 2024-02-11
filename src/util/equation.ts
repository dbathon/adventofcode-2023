import { RationalNumber, q } from "./rational";

const ZERO = q(0);
const ONE = q(1);
const MINUS_ONE = q(-1);

export abstract class Expression {
  abstract eval(variables: Map<string, RationalNumber>): RationalNumber | undefined;
  abstract toString(): string;
  abstract toJsonTree(): unknown[];
  toJsonString(): string {
    return JSON.stringify(this.toJsonTree());
  }
  abstract replace(replacements: Map<string, Expression>): Expression;
  abstract normalize(): Expression;
  abstract multiply(factor: RationalNumber): Expression;
  abstract divideByVariableIfPossible(variableName: string): Expression | undefined;
  abstract findFirstVariable(): string | undefined;
  abstract hasVariable(name: string): boolean;
}

function sortByJsonString(expressions: Expression[]): void {
  if (expressions.length > 1) {
    const jsonStrings = new Map<Expression, string>();
    for (const expression of expressions) {
      jsonStrings.set(expression, expression.toJsonString());
    }
    expressions.sort((a, b) => {
      const aJson = jsonStrings.get(a)!;
      const bJson = jsonStrings.get(b)!;
      return aJson === bJson ? 0 : aJson < bJson ? -1 : 1;
    });
  }
}

export class Sum extends Expression {
  constructor(readonly addends: Expression[]) {
    super();
  }

  toJsonTree(): unknown[] {
    return ["+", ...this.addends.map((addend) => addend.toJsonTree())];
  }

  replace(replacements: Map<string, Expression>): Expression {
    let anyChange = false;
    const newAddends = this.addends.map((addend) => {
      const newAddend = addend.replace(replacements);
      if (newAddend !== addend) {
        anyChange = true;
      }
      return newAddend;
    });
    return anyChange ? new Sum(newAddends) : this;
  }

  normalize(): Expression {
    const normalizedAddends = this.addends.flatMap((addend) => {
      const normalized = addend.normalize();
      return normalized instanceof Sum ? normalized.addends : [normalized];
    });
    let constant = ZERO;
    const otherExpressions: Expression[] = [];
    const variablesMap = new Map<string, RationalNumber>();
    for (const normalized of normalizedAddends) {
      if (normalized instanceof Product && normalized.isConstant()) {
        constant = constant.add(normalized.constant);
      } else if (
        normalized instanceof Product &&
        normalized.variables.length === 1 &&
        !normalized.otherFactors.length
      ) {
        // TODO: also handle cases with multiple variables etc....
        const name = normalized.variables[0];
        variablesMap.set(name, (variablesMap.get(name) ?? ZERO).add(normalized.constant));
      } else {
        otherExpressions.push(normalized);
      }
    }
    for (const entry of variablesMap.entries()) {
      otherExpressions.push(new Product(entry[1], [entry[0]], []));
    }

    if (otherExpressions.length) {
      if (!constant.equals(ZERO)) {
        otherExpressions.unshift(new Product(constant, [], []));
      }
      sortByJsonString(otherExpressions);
      return otherExpressions.length === 1 ? otherExpressions[0] : new Sum(otherExpressions);
    } else {
      return new Product(constant, [], []);
    }
  }

  multiply(factor: RationalNumber): Expression {
    return new Sum(this.addends.map((addend) => addend.multiply(factor)));
  }

  divideByVariableIfPossible(variableName: string): Expression | undefined {
    const newAddends: Expression[] = [];
    for (const addend of this.addends) {
      const newAddend = addend.divideByVariableIfPossible(variableName);
      if (!newAddend) {
        return undefined;
      }
      newAddends.push(newAddend);
    }
    return new Sum(newAddends);
  }

  eval(variables: Map<string, RationalNumber>): RationalNumber | undefined {
    let result = ZERO;
    for (const addend of this.addends) {
      const value = addend.eval(variables);
      if (value === undefined) {
        return undefined;
      }
      result.add(value);
    }
    return result;
  }

  findFirstVariable(): string | undefined {
    for (const addend of this.addends) {
      const result = addend.findFirstVariable();
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  hasVariable(name: string): boolean {
    return this.addends.some((addend) => addend.hasVariable(name));
  }

  toString(): string {
    return "(" + this.addends.map((addend) => addend.toString()).join(" + ") + ")";
  }
}

export class Product extends Expression {
  constructor(
    readonly constant: RationalNumber,
    readonly variables: string[],
    readonly otherFactors: Expression[]
  ) {
    super();
  }

  toJsonTree(): unknown[] {
    return [
      "*",
      this.constant.toString(),
      ...this.variables,
      ...this.otherFactors.map((factor) => factor.toJsonTree()),
    ];
  }

  replace(replacements: Map<string, Expression>): Expression {
    let anyChange = false;

    const newOtherFactors: Expression[] = this.otherFactors.map((factor) => {
      const newFactor = factor.replace(replacements);
      if (newFactor !== factor) {
        anyChange = true;
      }
      return newFactor;
    });

    const newVariables: string[] = [];
    for (const variable of this.variables) {
      const replacement = replacements.get(variable);
      if (replacement) {
        newOtherFactors.push(replacement);
        anyChange = true;
      } else {
        newVariables.push(variable);
      }
    }

    return anyChange ? new Product(this.constant, newVariables, newOtherFactors) : this;
  }

  normalize(): Expression {
    let constant = this.constant;
    const variables: string[] = [...this.variables];
    const otherFactors: Expression[] = [];
    for (const oldOtherFactor of this.otherFactors) {
      const normalized = oldOtherFactor.normalize();
      if (normalized instanceof Product) {
        constant = constant.multiply(normalized.constant);
        variables.push(...normalized.variables);
        otherFactors.push(...normalized.otherFactors);
      } else {
        otherFactors.push(normalized);
      }
    }
    if (constant.isZero()) {
      return new Product(ZERO, [], []);
    }
    const sumIndex = otherFactors.findIndex((factor) => factor instanceof Sum);
    if (sumIndex >= 0) {
      // multiply with each addend of the sum
      const sum = otherFactors[sumIndex] as Sum;
      otherFactors.splice(sumIndex, 1);
      return new Sum(
        sum.addends.map((addend) => new Product(constant, variables, [addend, ...otherFactors]))
      ).normalize();
    }
    sortByJsonString(otherFactors);
    return new Product(constant, variables.sort(), otherFactors);
  }

  divideByVariableIfPossible(variableName: string): Expression | undefined {
    const index = this.variables.indexOf(variableName);
    if (index >= 0) {
      const remainingVariables = [...this.variables];
      remainingVariables.splice(index, 1);
      return new Product(this.constant, remainingVariables, this.otherFactors);
    }
    const otherFactors = this.otherFactors;
    for (let i = 0; i < otherFactors.length; i++) {
      const newFactor = otherFactors[i].divideByVariableIfPossible(variableName);
      if (newFactor) {
        // we only need to divide one factor
        const newOtherFactors: Expression[] = [...this.otherFactors];
        newOtherFactors[i] = newFactor;
        return new Product(this.constant, this.variables, newOtherFactors);
      }
    }
    return undefined;
  }

  multiply(factor: RationalNumber): Expression {
    return new Product(this.constant.multiply(factor), this.variables, this.otherFactors);
  }

  eval(variables: Map<string, RationalNumber>): RationalNumber | undefined {
    let result = this.constant;
    for (const variableName of this.variables) {
      const value = variables.get(variableName);
      if (value === undefined) {
        throw new Error("unknown variable: " + variableName);
      }
      result = result.multiply(value);
    }
    for (const factor of this.otherFactors) {
      const value = factor.eval(variables);
      if (value === undefined) {
        return undefined;
      }
      result = result.multiply(value);
    }
    return result;
  }

  findFirstVariable(): string | undefined {
    if (this.variables.length) {
      return this.variables[0];
    }
    for (const factor of this.otherFactors) {
      const result = factor.findFirstVariable();
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  hasVariable(name: string): boolean {
    return this.variables.includes(name) || this.otherFactors.some((factor) => factor.hasVariable(name));
  }

  isConstant(): boolean {
    return !this.variables.length && !this.otherFactors.length;
  }

  toString(): string {
    const parts: string[] = [];
    if (!this.constant.equals(ONE)) {
      parts.push(this.constant.toString());
    }
    if (this.variables.length) {
      parts.push(...this.variables);
    }
    for (const factor of this.otherFactors) {
      parts.push(factor.toString());
    }
    if (!parts.length) {
      return "1";
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return "(" + parts.join("*") + ")";
  }
}

export class Fraction extends Expression {
  constructor(
    readonly numerator: Expression,
    readonly denominator: Expression
  ) {
    super();
  }

  toJsonTree(): unknown[] {
    return ["/", this.numerator.toJsonTree(), this.denominator.toJsonTree()];
  }

  replace(replacements: Map<string, Expression>): Expression {
    const newNumerator = this.numerator.replace(replacements);
    const newDenominator = this.denominator.replace(replacements);
    return newNumerator !== this.numerator || newDenominator !== this.denominator
      ? new Fraction(newNumerator, newDenominator)
      : this;
  }

  normalize(): Expression {
    const normalizedNumerator = this.numerator.normalize();
    const normalizedDenominator = this.denominator.normalize();
    if (
      normalizedDenominator instanceof Product &&
      !normalizedDenominator.constant.isZero() &&
      normalizedDenominator.isConstant()
    ) {
      return normalizedNumerator.multiply(ONE.divide(normalizedDenominator.constant));
    }

    if (normalizedDenominator instanceof Fraction) {
      return new Fraction(
        new Product(ONE, [], [normalizedNumerator, normalizedDenominator.denominator]),
        normalizedDenominator.numerator
      ).normalize();
    }

    if (normalizedNumerator instanceof Sum) {
      // convert to sum of fractions
      return new Sum(normalizedNumerator.addends.map((addend) => new Fraction(addend, normalizedDenominator)));
    }

    // TODO: more simplifications...

    return new Fraction(normalizedNumerator, normalizedDenominator);
  }

  multiply(factor: RationalNumber): Expression {
    return new Fraction(this.numerator.multiply(factor), this.denominator);
  }

  divideByVariableIfPossible(variableName: string): Expression | undefined {
    const newNumerator = this.numerator.divideByVariableIfPossible(variableName);
    return newNumerator ? new Fraction(newNumerator, this.denominator) : undefined;
  }

  eval(variables: Map<string, RationalNumber>): RationalNumber | undefined {
    const numerator = this.numerator.eval(variables);
    if (numerator === undefined) {
      return undefined;
    }
    const denominator = this.denominator.eval(variables);
    if (denominator === undefined || denominator.isZero()) {
      return undefined;
    }
    return numerator.divide(denominator);
  }

  findFirstVariable(): string | undefined {
    return this.numerator.findFirstVariable() ?? this.denominator.findFirstVariable();
  }

  hasVariable(name: string): boolean {
    return this.numerator.hasVariable(name) || this.denominator.hasVariable(name);
  }

  toString(): string {
    return "(" + this.numerator.toString() + " / " + this.denominator.toString() + ")";
  }
}

type SimpleExpressionInput = Expression | RationalNumber | number | string;

function simpleToExpression(input: SimpleExpressionInput): Expression {
  if (input instanceof Expression) {
    return input;
  } else if (input instanceof RationalNumber) {
    return new Product(input, [], []);
  } else if (typeof input === "number") {
    return new Product(q(input), [], []);
  } else {
    return new Product(ONE, [input], []);
  }
}

export function e(
  first: SimpleExpressionInput | "+" | "*" | "/" | "-",
  ...inputs: SimpleExpressionInput[]
): Expression {
  if (inputs.length) {
    const expressions = inputs.map(simpleToExpression);
    switch (first) {
      case "+":
        return new Sum(expressions);
      case "*":
        return new Product(ONE, [], expressions);
      case "/":
        if (expressions.length !== 2) {
          throw new Error("invalid number of expressions");
        }
        return new Fraction(expressions[0], expressions[1]);
      case "-":
        if (expressions.length !== 1) {
          throw new Error("invalid number of expressions");
        }
        return expressions[0].multiply(MINUS_ONE);
    }
    throw new Error("invalid operator: " + first);
  } else {
    return simpleToExpression(first);
  }
}

/**
 * Transpose the expression to an expression that equals the given variable if the given expression equals zero.
 */
export function solveExpressionForVariable(expression: Expression, variableName: string): Expression | undefined {
  let left = expression.normalize();
  let right: Expression = new Product(ZERO, [], []);

  if (!(left instanceof Sum)) {
    // build dummy sum for first iteration
    left = new Sum([left]);
  }

  while (left instanceof Sum) {
    let progress = false;
    const leftParts: Expression[] = [];
    const rightParts: Expression[] = [];

    for (const addend of left.addends) {
      if (addend.hasVariable(variableName)) {
        leftParts.push(addend);
      } else {
        rightParts.push(addend.multiply(MINUS_ONE));
        progress = true;
      }
    }

    if (!leftParts.length) {
      return undefined;
    }

    left = new Sum(leftParts).normalize();
    right = new Sum([right, ...rightParts]).normalize();

    if (left instanceof Product) {
      const index = left.variables.indexOf(variableName);
      if (index >= 0 && left.variables.indexOf(variableName, index + 1) < 0) {
        const leftRest = left.divideByVariableIfPossible(variableName);
        if (!leftRest) {
          throw new Error("divideByVariableIfPossible() failed");
        }
        left = new Product(ONE, [variableName], []);
        right = new Fraction(right, leftRest);
        progress = true;
      }
    }

    const leftRemainder = left.divideByVariableIfPossible(variableName);
    if (leftRemainder) {
      return new Fraction(right, leftRemainder).normalize();
    }

    if (!progress) {
      break;
    }
  }

  throw new Error("case not implemented: " + left.toString() + ", " + variableName);
}

/**
 * Tries to find variable assignments so that all expressions are zero.
 */
export function findSolution(expressions: Expression[]): Map<string, RationalNumber> | undefined {
  const result = new Map<string, RationalNumber>();
  let replacements = new Map<string, Expression>();
  const remaining = [...expressions];
  while (remaining.length) {
    const current = remaining.shift()!.replace(replacements).normalize();
    const variableName = current.findFirstVariable();
    if (variableName === undefined) {
      const value = current.eval(result);
      if (!value || !value.equals(ZERO)) {
        // no solution exists
        return undefined;
      }
    } else {
      const replacement = solveExpressionForVariable(current, variableName);
      if (!replacement) {
        // no solution exists
        return undefined;
      }
      replacements.set(variableName, replacement);
      remaining.push(current);

      // update all other replacements
      replacements = new Map(
        [...replacements.entries()].map((entry) => [entry[0], entry[1].replace(replacements).normalize()])
      );
    }
  }

  // every replacement should be a constant now
  for (const entry of replacements.entries()) {
    const value = entry[1].eval(result);
    if (!value) {
      // no solution exists
      return undefined;
    }
    result.set(entry[0], value);
  }

  return result;
}
