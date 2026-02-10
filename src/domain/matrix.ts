export function zeros(length: number): number[] {
  return new Array(length).fill(0);
}

export function zerosMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

export function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row]);
}

export function addVectors(a: number[], b: number[]): number[] {
  return a.map((value, i) => value + b[i]);
}

export function subVectors(a: number[], b: number[]): number[] {
  return a.map((value, i) => value - b[i]);
}

export function scaleVector(a: number[], scalar: number): number[] {
  return a.map((value) => value * scalar);
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

export function matrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => dot(row, vector));
}

export function addMatrices(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

export function scaleMatrix(a: number[][], scalar: number): number[][] {
  return a.map((row) => row.map((value) => value * scalar));
}

export function inverse(matrix: number[][]): number[][] {
  const n = matrix.length;
  const aug = matrix.map((row, i) => [
    ...row,
    ...new Array(n).fill(0).map((_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    let maxAbs = Math.abs(aug[pivot][col]);
    for (let row = col + 1; row < n; row += 1) {
      const absValue = Math.abs(aug[row][col]);
      if (absValue > maxAbs) {
        maxAbs = absValue;
        pivot = row;
      }
    }

    if (maxAbs < 1e-20) {
      throw new Error("Matrix inversion failed: singular matrix.");
    }

    if (pivot !== col) {
      const temp = aug[col];
      aug[col] = aug[pivot];
      aug[pivot] = temp;
    }

    const pivotValue = aug[col][col];
    for (let j = 0; j < 2 * n; j += 1) {
      aug[col][j] /= pivotValue;
    }

    for (let row = 0; row < n; row += 1) {
      if (row === col) {
        continue;
      }
      const factor = aug[row][col];
      if (Math.abs(factor) < 1e-30) {
        continue;
      }
      for (let j = 0; j < 2 * n; j += 1) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  return aug.map((row) => row.slice(n));
}
