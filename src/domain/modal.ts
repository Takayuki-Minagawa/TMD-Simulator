import { EigenvalueDecomposition, Matrix } from "ml-matrix";
import type { ModalResult } from "@/domain/types.ts";

function setKMatrix(ki: number[]): number[][] {
  const n = ki.length;
  const k = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    if (i !== n - 1) {
      k[i][i] = ki[i] + ki[i + 1];
      k[i + 1][i] = -ki[i + 1];
      k[i][i + 1] = -ki[i + 1];
    } else {
      k[i][i] = ki[i];
    }
  }
  return k;
}

export function eigenWork(mi: number[], ki: number[]): ModalResult {
  const n = mi.length;
  if (n === 0 || n !== ki.length) {
    throw new Error("Invalid modal input.");
  }

  const k = setKMatrix(ki);
  const a = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => k[i][j] / mi[i]),
  );

  const evd = new EigenvalueDecomposition(new Matrix(a));
  const eigenValues = Array.from(evd.realEigenvalues);
  const eigenVectors = evd.eigenvectorMatrix;
  const pi2 = Math.PI * 2;

  const modeIndex = eigenValues
    .map((lambda, index) => ({
      index,
      period: lambda > 0 ? pi2 / Math.sqrt(lambda) : Number.POSITIVE_INFINITY,
    }))
    .sort((lhs, rhs) => rhs.period - lhs.period);

  const naturalPeriod = modeIndex.map((mode) => mode.period);
  const naturalFrequency = naturalPeriod.map((period) =>
    Number.isFinite(period) && period > 0 ? 1 / period : 0,
  );

  const eigenVector = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let mode = 0; mode < n; mode += 1) {
    const sourceIndex = modeIndex[mode].index;
    let maxV = 1;
    let maxAbs = 0;
    for (let i = 0; i < n; i += 1) {
      const value = eigenVectors.get(i, sourceIndex);
      eigenVector[mode][i] = value;
      if (Math.abs(value) > maxAbs) {
        maxAbs = Math.abs(value);
        maxV = value;
      }
    }
    if (Math.abs(maxV) < 1e-10) {
      maxV = 1;
    }
    for (let i = 0; i < n; i += 1) {
      eigenVector[mode][i] /= maxV;
    }
  }

  const modeShape = Array.from({ length: n }, () => new Array(n).fill(0));
  const participationFactor = new Array(n).fill(0);
  const effectiveMassRatio = new Array(n).fill(0);
  const sumMass = mi.reduce((sum, value) => sum + value, 0);

  for (let mode = 0; mode < n; mode += 1) {
    const u = eigenVector[mode];
    let du = 0;
    let dl = 0;
    for (let i = 0; i < n; i += 1) {
      du += u[i] * mi[i];
      dl += u[i] * mi[i] * u[i];
    }
    const coeff = Math.abs(dl) < 1e-20 ? 0 : du / dl;
    for (let i = 0; i < n; i += 1) {
      modeShape[mode][i] = coeff * u[i];
    }
    effectiveMassRatio[mode] = dl;
    participationFactor[mode] =
      Math.abs(eigenVector[mode][0]) < 1e-20
        ? 0
        : modeShape[mode][0] / eigenVector[mode][0];
    effectiveMassRatio[mode] *= (participationFactor[mode] ** 2) / sumMass;
  }

  return {
    naturalPeriod,
    naturalFrequency,
    participationFactor,
    effectiveMassRatio,
    eigenVector,
    modeShape,
  };
}
