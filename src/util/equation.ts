import { RationalNumber, q } from "./rational";

const ZERO = q(0);
const ONE = q(1);
const MINUS_ONE = q(-1);

export abstract class Expression {
  abstract eval(variables: Map<string, RationalNumber>): RationalNumber | undefined;
  abstract toString(): string;
  abstract replaceAndSimplify(replacements?: Map<string, Expression>): Expression;
  abstract multiply(factor: RationalNumber): Expression;
  abstract divideByVariableIfPossible(variableName: string): Expression | undefined;
  abstract findFirstVariable(): string | undefined;
  abstract hasVariable(name: string): boolean;
}

export class Constant extends Expression {
  constructor(readonly value: RationalNumber) {
    super();
  }

  replaceAndSimplify(): Expression {
    return this;
  }

  multiply(factor: RationalNumber): Expression {
    return new Constant(this.value.multiply(factor));
  }

  divideByVariableIfPossible(variableName: string): Expression | undefined {
    return undefined;
  }

  eval(): RationalNumber {
    return this.value;
  }

  findFirstVariable(): string | undefined {
    return undefined;
  }

  hasVariable(name: string): boolean {
    return false;
  }

  toString(): string {
    return this.value.toString();
  }
}

export class Variable extends Expression {
  constructor(
    readonly name: string,
    readonly factor: RationalNumber = ONE
  ) {
    super();
  }

  replaceAndSimplify(replacements?: Map<string, Expression>): Expression {
    const replacement = replacements?.get(this.name);
    if (replacement) {
      return new Product([new Constant(this.factor), replacement]).replaceAndSimplify(replacements);
    }
    return this;
  }

  multiply(factor: RationalNumber): Expression {
    return new Variable(this.name, this.factor.multiply(factor));
  }

  divideByVariableIfPossible(variableName: string): Expression | undefined {
    return variableName === this.name ? new Constant(this.factor) : undefined;
  }

  eval(variables: Map<string, RationalNumber>): RationalNumber {
    const value = variables.get(this.name);
    if (value === undefined) {
      throw new Error("unknown variable: " + this.name);
    }
    return value.multiply(this.factor);
  }

  findFirstVariable(): string | undefined {
    return this.name;
  }

  hasVariable(name: string): boolean {
    return name === this.name;
  }

  toString(): string {
    return this.factor.equals(ONE) ? this.name : "(" + this.factor + "*" + this.name + ")";
  }
}

export class Sum extends Expression {
  constructor(readonly addends: Expression[]) {
    super();
  }

  replaceAndSimplify(replacements?: Map<string, Expression>): Expression {
    const simplifiedAddends = this.addends.flatMap((addend) => {
      const simplified = addend.replaceAndSimplify(replacements);
      return simplified instanceof Sum ? simplified.addends : [simplified];
    });
    let constant = ZERO;
    const otherExpressions: Expression[] = [];
    const variablesMap = new Map<string, Variable>();
    for (const simplified of simplifiedAddends) {
      if (simplified instanceof Constant) {
        constant = constant.add(simplified.value);
      } else if (simplified instanceof Variable) {
        const name = simplified.name;
        const existing = variablesMap.get(name);
        variablesMap.set(
          simplified.name,
          existing ? new Variable(name, existing.factor.add(simplified.factor)) : simplified
        );
      } else {
        otherExpressions.push(simplified);
      }
    }
    otherExpressions.push(...variablesMap.values());

    if (otherExpressions.length) {
      if (!constant.equals(ZERO)) {
        otherExpressions.unshift(new Constant(constant));
      }
      return otherExpressions.length === 1 ? otherExpressions[0] : new Sum(otherExpressions);
    } else {
      return new Constant(constant);
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
  constructor(readonly factors: Expression[]) {
    super();
  }

  replaceAndSimplify(replacements?: Map<string, Expression>): Expression {
    const simplifiedFactors = this.factors.flatMap((factor) => {
      const simplified = factor.replaceAndSimplify(replacements);
      return simplified instanceof Product ? simplified.factors : [simplified];
    });
    let constant = ONE;
    const otherExpressions: Expression[] = [];
    for (const simplified of simplifiedFactors) {
      if (simplified instanceof Constant) {
        constant = constant.multiply(simplified.value);
      } else {
        otherExpressions.push(simplified);
      }
    }

    if (otherExpressions.length) {
      const multiplied = otherExpressions.map((expression) => expression.multiply(constant));
      return multiplied.length === 1 ? multiplied[0] : new Product(multiplied);
    } else {
      return new Constant(constant);
    }
  }

  divideByVariableIfPossible(variableName: string): Expression | undefined {
    const newFactors: Expression[] = [...this.factors];
    for (let i = 0; i < newFactors.length; i++) {
      const newFactor = newFactors[i].divideByVariableIfPossible(variableName);
      if (newFactor) {
        // we only need to divide one factor
        newFactors[i] = newFactor;
        return new Product(newFactors);
      }
    }
    return undefined;
  }

  multiply(factor: RationalNumber): Expression {
    return new Product([new Constant(factor), ...this.factors]);
  }

  eval(variables: Map<string, RationalNumber>): RationalNumber | undefined {
    let result = ONE;
    for (const factor of this.factors) {
      const value = factor.eval(variables);
      if (value === undefined) {
        return undefined;
      }
      result.multiply(value);
    }
    return result;
  }

  findFirstVariable(): string | undefined {
    for (const factor of this.factors) {
      const result = factor.findFirstVariable();
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  hasVariable(name: string): boolean {
    return this.factors.some((factor) => factor.hasVariable(name));
  }

  toString(): string {
    return "(" + this.factors.map((factor) => factor.toString()).join(" * ") + ")";
  }
}

export class Fraction extends Expression {
  constructor(
    readonly numerator: Expression,
    readonly denominator: Expression
  ) {
    super();
  }

  replaceAndSimplify(replacements?: Map<string, Expression>): Expression {
    const simplifiedNumerator = this.numerator.replaceAndSimplify(replacements);
    const simplifiedDenominator = this.denominator.replaceAndSimplify(replacements);
    if (simplifiedDenominator instanceof Constant && !simplifiedDenominator.value.isZero()) {
      return new Product([
        new Constant(ONE.divide(simplifiedDenominator.value)),
        simplifiedNumerator,
      ]).replaceAndSimplify(replacements);
    }

    if (simplifiedNumerator instanceof Sum) {
      // convert to sum of fractions
      return new Sum(simplifiedNumerator.addends.map((addend) => new Fraction(addend, simplifiedDenominator)));
    }

    // TODO: more simplifications...

    return new Fraction(simplifiedNumerator, simplifiedDenominator);
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
    return new Constant(input);
  } else if (typeof input === "number") {
    return new Constant(q(input));
  } else {
    return new Variable(input);
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
        return new Product(expressions);
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
  let left = expression.replaceAndSimplify();
  let right: Expression = new Constant(ZERO);

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
      throw new Error("variable not found: " + variableName);
    }

    left = new Sum(leftParts).replaceAndSimplify();
    right = new Sum([right, ...rightParts]).replaceAndSimplify();

    if (left instanceof Product) {
      const variableFactors: Variable[] = [];
      const otherFactors: Expression[] = [];
      for (const factor of left.factors) {
        if (factor instanceof Variable && factor.name === variableName) {
          variableFactors.push(factor);
        } else {
          otherFactors.push(factor);
        }
      }
      if (variableFactors.length === 1) {
        left = variableFactors[0];
        right = new Fraction(right, new Product(otherFactors));
        progress = true;
      }
    }

    const leftRemainder = left.divideByVariableIfPossible(variableName);
    if (leftRemainder) {
      return new Fraction(right, leftRemainder).replaceAndSimplify();
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
    const current = remaining.shift()!.replaceAndSimplify(replacements);
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
        [...replacements.entries()].map((entry) => [entry[0], entry[1].replaceAndSimplify(replacements)])
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
