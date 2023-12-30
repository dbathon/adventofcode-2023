function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? a : gcd(b, a % b);
}

export class RationalNumber {
  readonly numerator: bigint;
  readonly denominator: bigint;
  constructor(numerator: bigint, denominator: bigint) {
    if (denominator === 0n) {
      throw new Error("0 denominator");
    }

    // normalize
    if (denominator <= 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }

    const divisor = gcd(numerator >= 0n ? numerator : -numerator, denominator);
    this.numerator = numerator / divisor;
    this.denominator = denominator / divisor;
  }

  add(other: RationalNumber): RationalNumber {
    return new RationalNumber(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  subtract(other: RationalNumber): RationalNumber {
    return new RationalNumber(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  negate(): RationalNumber {
    return new RationalNumber(-this.numerator, this.denominator);
  }

  multiply(other: RationalNumber): RationalNumber {
    return new RationalNumber(this.numerator * other.numerator, this.denominator * other.denominator);
  }

  divide(other: RationalNumber): RationalNumber {
    return new RationalNumber(this.numerator * other.denominator, this.denominator * other.numerator);
  }

  equals(other: RationalNumber): boolean {
    return this.denominator === other.denominator && this.numerator === other.numerator;
  }

  lessThan(other: RationalNumber): boolean {
    return this.numerator * other.denominator <= other.numerator * this.denominator;
  }

  isZero(): boolean {
    return this.numerator === 0n;
  }

  toString(): string {
    if (this.denominator === 1n) {
      return this.numerator.toString();
    } else {
      return "(" + this.numerator.toString() + "/" + this.denominator.toString() + ")";
    }
  }

  toNumber(): number {
    if (this.denominator === 1n) {
      return Number(this.numerator);
    } else {
      return Number(this.numerator) / Number(this.denominator);
    }
  }
}

/** Convenience "constructor" for RationalNumber. */
export function q(numerator: string | number | bigint, denominator: string | number | bigint = 1n): RationalNumber {
  return new RationalNumber(BigInt(numerator), BigInt(denominator));
}
