import { DT, GRAVITY } from "@/domain/format.ts";
import {
  addMatrices,
  addVectors,
  inverse,
  matrixVector,
  scaleMatrix,
  scaleVector,
  subVectors,
  zeros,
  zerosMatrix,
} from "@/domain/matrix.ts";
import { eigenWork } from "@/domain/modal.ts";
import type { ModelData, ResponseResult } from "@/domain/types.ts";

const GAMMA = 0.5;
const BETA = 0.25;
const PI = Math.PI;

interface ModelNode {
  orgNo: number;
  isMain: boolean;
  weight: number;
  calcNo: number;
}

interface ModelElement {
  nodeI: number;
  nodeJ: number;
  layer: number;
  isMain: boolean;
  ke: number;
  he: number;
  ce: number;
  calcI: number;
  calcJ: number;
}

interface StructMatrices {
  mm: number[][];
  km: number[][];
  cm: number[][];
  mainCount: number;
  tmdCount: number;
  tmdFloors: number[];
}

function normalizeModel(model: ModelData): ModelData {
  const storyCount = Math.max(1, model.storyCount);
  const normalize = (values: number[]) => {
    const result = values.slice(0, storyCount);
    while (result.length < storyCount) {
      result.push(0);
    }
    return result;
  };
  return {
    ...model,
    storyCount,
    weightsKn: normalize(model.weightsKn),
    stiffnessKnPerCm: normalize(model.stiffnessKnPerCm),
    extraDampingKnPerKine: normalize(model.extraDampingKnPerKine),
    tmdList: model.tmdList
      .filter((item) => item.floor > 0)
      .map((item) => ({
        floor: Math.min(storyCount, Math.max(1, Math.floor(item.floor))),
        weightKn: item.weightKn,
        freqHz: item.freqHz,
      })),
  };
}

function buildStructMatrices(
  modelInput: ModelData,
  calcDampingH: number,
): StructMatrices {
  const model = normalizeModel(modelInput);
  const nodes: ModelNode[] = [];
  const elements: ModelElement[] = [];
  const mainCount = model.storyCount;

  for (let i = 0; i < mainCount; i += 1) {
    nodes.push({
      orgNo: i + 1,
      isMain: true,
      weight: model.weightsKn[i] / GRAVITY,
      calcNo: -1,
    });
  }

  for (let i = 0; i < model.tmdList.length; i += 1) {
    const tmd = model.tmdList[i];
    nodes.push({
      orgNo: 100 + i,
      isMain: false,
      weight: tmd.weightKn / GRAVITY,
      calcNo: -1,
    });
  }

  for (let i = 0; i < mainCount; i += 1) {
    elements.push({
      nodeI: i,
      nodeJ: i + 1,
      layer: i + 1,
      isMain: true,
      ke: model.stiffnessKnPerCm[i] / GRAVITY,
      he: calcDampingH,
      ce: model.extraDampingKnPerKine[i] / GRAVITY,
      calcI: -1,
      calcJ: -1,
    });
  }

  const totalMainWeight = model.weightsKn.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < model.tmdList.length; i += 1) {
    const tmd = model.tmdList[i];
    const myu = totalMainWeight > 0 ? tmd.weightKn / totalMainWeight : 0;
    const kTmd =
      (4 * PI * PI * tmd.freqHz * tmd.freqHz * (tmd.weightKn / GRAVITY)) / 100;
    const hOpt = Math.sqrt((3 / 8) * (myu / (1 + myu)));
    elements.push({
      nodeI: 100 + i,
      nodeJ: tmd.floor,
      layer: -1,
      isMain: false,
      ke: kTmd / GRAVITY,
      he: hOpt,
      ce: 0,
      calcI: -1,
      calcJ: -1,
    });
  }

  nodes
    .filter((node) => node.orgNo > 0)
    .sort((lhs, rhs) => lhs.orgNo - rhs.orgNo)
    .forEach((node, index) => {
      node.calcNo = index;
    });

  for (const element of elements) {
    const nodeI = element.nodeI === 0 ? null : nodes.find((node) => node.orgNo === element.nodeI);
    const nodeJ = element.nodeJ === 0 ? null : nodes.find((node) => node.orgNo === element.nodeJ);
    element.calcI = nodeI ? nodeI.calcNo : -1;
    element.calcJ = nodeJ ? nodeJ.calcNo : -1;
  }

  const modalMass = model.weightsKn.map((weight) => weight / (GRAVITY * 980.665));
  const modalStiffness = elements
    .filter((element) => element.isMain)
    .sort((lhs, rhs) => lhs.layer - rhs.layer)
    .map((element) => element.ke);
  const modal = eigenWork(modalMass, modalStiffness);
  const firstOmega =
    modal.naturalPeriod[0] > 0 ? (2 * PI) / modal.naturalPeriod[0] : 0;

  for (const element of elements) {
    if (firstOmega > 0) {
      element.ce += (2 * element.he * element.ke) / firstOmega;
    }
  }

  const dof = nodes.length;
  const mm = zerosMatrix(dof);
  const km = zerosMatrix(dof);
  const cm = zerosMatrix(dof);

  for (const node of nodes) {
    mm[node.calcNo][node.calcNo] = node.weight / 980.665;
  }

  const addElement = (matrix: number[][], element: ModelElement, value: number) => {
    const { calcI, calcJ } = element;
    if (calcI >= 0 && calcJ >= 0) {
      matrix[calcI][calcI] += value;
      matrix[calcJ][calcJ] += value;
      matrix[calcI][calcJ] -= value;
      matrix[calcJ][calcI] -= value;
    } else if (calcI >= 0 && calcJ < 0) {
      matrix[calcI][calcI] += value;
    } else if (calcI < 0 && calcJ >= 0) {
      matrix[calcJ][calcJ] += value;
    }
  };

  for (const element of elements) {
    addElement(km, element, element.ke);
    addElement(cm, element, element.ce);
  }

  return {
    mm,
    km,
    cm,
    mainCount,
    tmdCount: model.tmdList.length,
    tmdFloors: model.tmdList.map((item) => item.floor),
  };
}

function setForceVector(
  vector: number[],
  step: number,
  mainCount: number,
  forceSeries: { floorIndex: number; data: number[] }[],
): void {
  vector.fill(0);
  for (const force of forceSeries) {
    if (force.floorIndex < 0 || force.floorIndex >= mainCount) {
      continue;
    }
    const current = force.data[step] ?? 0;
    if (step === 0) {
      vector[force.floorIndex] += current;
    } else {
      vector[force.floorIndex] += current - (force.data[step - 1] ?? 0);
    }
  }
}

function resolveDamping(model: ModelData, requestedDampingH: number): number {
  if (requestedDampingH >= 0) {
    return requestedDampingH;
  }
  const mi = model.weightsKn.map((weight) => weight / GRAVITY);
  const ki = model.stiffnessKnPerCm.map((value) => value * 100);
  const modal = eigenWork(mi, ki);
  const f1 =
    modal.naturalPeriod[0] > 0 && Number.isFinite(modal.naturalPeriod[0])
      ? 1 / modal.naturalPeriod[0]
      : 0;
  return Math.min(f1 / 150, 0.04);
}

export function runResponse(
  name: string,
  model: ModelData,
  wave: number[],
  dampingH: number,
  forceSeries: { floorIndex: number; data: number[] }[] = [],
): ResponseResult {
  const normalizedModel = normalizeModel(model);
  const calcDampingH = resolveDamping(normalizedModel, dampingH);
  const { mm, km, cm, mainCount, tmdCount, tmdFloors } = buildStructMatrices(
    normalizedModel,
    calcDampingH,
  );

  const dof = mm.length;
  const um = new Array(dof).fill(1);
  const fv = zeros(dof);
  const inputWave = [...wave];
  const time = inputWave.map((_, i) => i * DT);

  const mainAcc = Array.from({ length: mainCount }, () => [] as number[]);
  const mainDis = Array.from({ length: mainCount }, () => [] as number[]);
  const tmdAcc = Array.from({ length: tmdCount }, () => [] as number[]);
  const tmdDis = Array.from({ length: tmdCount }, () => [] as number[]);

  let a1 = zeros(dof);
  let v1 = zeros(dof);
  let d1 = zeros(dof);
  const tk = inverse(
    addMatrices(
      addMatrices(mm, scaleMatrix(cm, DT / 2)),
      scaleMatrix(km, BETA * DT * DT),
    ),
  );

  for (let step = 0; step < inputWave.length; step += 1) {
    const y2 = inputWave[step];
    const previousWave = step === 0 ? 0 : inputWave[step - 1];
    const deltaInput = y2 - previousWave;
    const yi = scaleVector(um, deltaInput);
    let inpVec = scaleVector(matrixVector(mm, yi), -1);

    if (forceSeries.length > 0) {
      setForceVector(fv, step, mainCount, forceSeries);
      inpVec = addVectors(inpVec, fv);
    }

    const term1 = addVectors(inpVec, matrixVector(mm, a1));
    const term2 = matrixVector(cm, scaleVector(a1, DT / 2));
    const term3 = matrixVector(
      km,
      addVectors(
        scaleVector(v1, DT),
        scaleVector(a1, (0.5 - BETA) * DT * DT),
      ),
    );
    const rhs = subVectors(subVectors(term1, term2), term3);
    const a2 = matrixVector(tk, rhs);
    const v2 = addVectors(v1, scaleVector(addVectors(scaleVector(a2, GAMMA), scaleVector(a1, 1 - GAMMA)), DT));
    const d2 = addVectors(
      d1,
      addVectors(
        scaleVector(v1, DT),
        scaleVector(addVectors(scaleVector(a2, BETA), scaleVector(a1, 0.5 - BETA)), DT * DT),
      ),
    );
    const absA = addVectors(a2, scaleVector(um, y2));

    for (let i = 0; i < mainCount; i += 1) {
      mainAcc[i].push(absA[i]);
      mainDis[i].push(d2[i]);
    }
    for (let i = 0; i < tmdCount; i += 1) {
      tmdAcc[i].push(absA[mainCount + i]);
      tmdDis[i].push(d2[mainCount + i]);
    }

    a1 = a2;
    v1 = v2;
    d1 = d2;
  }

  return {
    name,
    modelName: normalizedModel.name,
    mainMassCount: mainCount,
    tmdCount,
    tmdFloors,
    time,
    waveAcc: inputWave,
    mainAcc,
    mainDis,
    tmdAcc,
    tmdDis,
  };
}

export function createForceWaveInput(
  sourceWave: number[],
  maxForceKn: number,
): number[] {
  const scale = maxForceKn / GRAVITY;
  return sourceWave.map((value) => value * scale);
}

export function createZeroWave(length: number): number[] {
  return new Array(length).fill(0);
}

export function getResultMaxValues(result: ResponseResult): {
  maxMainAcc: number;
  maxMainDis: number;
  maxTmdAcc: number;
  maxTmdDis: number;
} {
  const maxAbs = (data: number[][]): number =>
    data.reduce(
      (current, series) =>
        Math.max(
          current,
          ...series.map((value) => Math.abs(value)),
        ),
      0,
    );
  return {
    maxMainAcc: maxAbs(result.mainAcc),
    maxMainDis: maxAbs(result.mainDis),
    maxTmdAcc: maxAbs(result.tmdAcc),
    maxTmdDis: maxAbs(result.tmdDis),
  };
}
