import { RationalNumber } from "./rational";

/**
 * @returns the unique solution if it exists, undefined otherwise
 */
export function solveSystemOfLinearEquations(
  coefficientRows: RationalNumber[][],
  constants: RationalNumber[]
): RationalNumber[] | undefined {
  if (coefficientRows.length !== constants.length || constants.length < 1) {
    throw new Error("invalid constants count");
  }
  const coefficientCount = coefficientRows[0].length;
  if (!coefficientRows.every((row) => row.length === coefficientCount)) {
    throw new Error("unequal coefficient counts");
  }
  if (coefficientCount < 1) {
    throw new Error("invalid coefficient count");
  }

  if (coefficientCount === 1) {
    // "trivial" case
    const divisor = coefficientRows[0][0];
    if (divisor.isZero()) {
      return undefined;
    }
    const solution = constants[0].divide(divisor);
    // verify with other rows (if any)
    for (let i = 1; i < coefficientRows.length; i++) {
      if (solution.multiply(coefficientRows[i][0]).equals(constants[i])) {
        return undefined;
      }
    }
    return [solution];
  } else {
    // solve recursively
    const newCoefficientRows: RationalNumber[][] = [];
    const newConstants: RationalNumber[] = [];

    // find a row where the first coefficient is not zero
    let nonZeroRowIndex = 0;
    for (; nonZeroRowIndex < coefficientRows.length; nonZeroRowIndex++) {
      const subtractedRow = coefficientRows[nonZeroRowIndex];
      if (!subtractedRow[0].isZero()) {
        const subtractedConstant = constants[nonZeroRowIndex];
        // and now subtract this row from all other rows to eliminate the first unknown
        for (let i = 0; i < coefficientRows.length; i++) {
          if (i !== nonZeroRowIndex) {
            const currentRow = coefficientRows[i];
            if (currentRow[0].isZero()) {
              newCoefficientRows.push(currentRow.slice(1));
              newConstants.push(constants[i]);
            } else {
              const factor = currentRow[0].divide(subtractedRow[0]);
              newCoefficientRows.push(
                currentRow.slice(1).map((coefficient, k) => coefficient.subtract(subtractedRow[k + 1].multiply(factor)))
              );
              newConstants.push(constants[i].subtract(subtractedConstant.multiply(factor)));
            }
          }
        }
        break;
      }
    }

    if (!newConstants.length) {
      // under-defined system of linear equations
      return undefined;
    }
    const restSolution = solveSystemOfLinearEquations(newCoefficientRows, newConstants);
    if (!restSolution) {
      return undefined;
    }

    let solution = constants[nonZeroRowIndex];
    for (let i = 1; i < coefficientCount; i++) {
      solution = solution.subtract(coefficientRows[nonZeroRowIndex][i].multiply(restSolution[i - 1]));
    }
    solution = solution.divide(coefficientRows[nonZeroRowIndex][0]);
    return [solution, ...restSolution];
  }
}
