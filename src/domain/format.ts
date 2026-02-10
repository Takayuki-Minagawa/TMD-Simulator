import type {
  ModelData,
  ResponseResult,
  TmdSetting,
  WaveAnalysisResult,
} from "@/domain/types.ts";

export const DT = 0.01;
export const GRAVITY = 9.80665;

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((value) => value.trim());
}

export function createEmptyModel(name = "ModelA"): ModelData {
  return {
    name,
    storyCount: 3,
    weightsKn: [1000, 1000, 900],
    stiffnessKnPerCm: [1200, 1100, 900],
    extraDampingKnPerKine: [0, 0, 0],
    tmdList: [{ floor: 3, weightKn: 30, freqHz: 2.5 }],
  };
}

function normalizeStoryArray(data: number[], storyCount: number): number[] {
  const result = data.slice(0, storyCount);
  while (result.length < storyCount) {
    result.push(0);
  }
  return result;
}

export function parseModelDat(text: string, fallbackName = "Model"): ModelData {
  let name = fallbackName;
  let storyCount = 0;
  let weights: number[] = [];
  let stiffness: number[] = [];
  let damp: number[] = [];
  const tmdList: TmdSetting[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const columns = parseCsvLine(line);
    const key = columns[0];
    switch (key) {
      case "NAME":
        name = columns[1] ?? fallbackName;
        break;
      case "質点数":
        storyCount = Math.max(1, Math.floor(toNumber(columns[1] ?? "0")));
        break;
      case "重量[kN]":
        weights = columns.slice(1).map(toNumber);
        break;
      case "剛性[kN/cm]":
        stiffness = columns.slice(1).map(toNumber);
        break;
      case "付加減衰係数[kN/kine]":
        damp = columns.slice(1).map(toNumber);
        break;
      case "TMD":
        if (columns.length >= 4) {
          tmdList.push({
            floor: Math.floor(toNumber(columns[1])),
            weightKn: toNumber(columns[2]),
            freqHz: toNumber(columns[3]),
          });
        }
        break;
      default:
        break;
    }
  }

  if (storyCount <= 0) {
    storyCount = Math.max(weights.length, stiffness.length, damp.length, 1);
  }

  return {
    name,
    storyCount,
    weightsKn: normalizeStoryArray(weights, storyCount),
    stiffnessKnPerCm: normalizeStoryArray(stiffness, storyCount),
    extraDampingKnPerKine: normalizeStoryArray(damp, storyCount),
    tmdList: tmdList.filter((item) => item.floor > 0),
  };
}

export function serializeModelDat(model: ModelData): string {
  const storyCount = Math.max(1, model.storyCount);
  const weights = normalizeStoryArray(model.weightsKn, storyCount);
  const stiffness = normalizeStoryArray(model.stiffnessKnPerCm, storyCount);
  const damp = normalizeStoryArray(model.extraDampingKnPerKine, storyCount);
  const lines: string[] = [
    `NAME,${model.name}`,
    `質点数,${storyCount}`,
    `重量[kN],${weights.join(",")}`,
    `剛性[kN/cm],${stiffness.join(",")}`,
    `付加減衰係数[kN/kine],${damp.join(",")}`,
    "# TMD情報",
  ];
  for (const tmd of model.tmdList) {
    lines.push(`TMD,${Math.floor(tmd.floor)},${tmd.weightKn},${tmd.freqHz}`);
  }
  return lines.join("\r\n");
}

export function parseWaveCsv(text: string): number[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => toNumber(parseCsvLine(line)[0] ?? "0"));
}

export function serializeWaveCsv(wave: number[]): string {
  return wave.map((value) => `${value}`).join("\r\n");
}

export function serializeResponseCsv(result: ResponseResult): string {
  const mainN = result.mainMassCount;
  const tmdN = result.tmdCount;
  const headers = ["Time[s]", "入力波[gal]"];
  for (let i = 0; i < mainN; i += 1) {
    headers.push(`A_${i + 2}F(gal)`);
  }
  for (let i = 0; i < mainN; i += 1) {
    headers.push(`D_${i + 2}F(cm)`);
  }
  for (let i = 0; i < tmdN; i += 1) {
    const floor = result.tmdFloors[i] ?? i + 1;
    headers.push(`Atmd${String(i + 1).padStart(2, "0")}-M${floor}(gal)`);
  }
  for (let i = 0; i < tmdN; i += 1) {
    const floor = result.tmdFloors[i] ?? i + 1;
    headers.push(`Dtmd${String(i + 1).padStart(2, "0")}-M${floor}(cm)`);
  }

  const lines: string[] = [
    `主架構質点数,${mainN}`,
    `TMD数,${tmdN}`,
    headers.join(","),
  ];

  const rowCount = result.time.length;
  for (let i = 0; i < rowCount; i += 1) {
    const row: (number | string)[] = [
      (i * DT).toFixed(2),
      result.waveAcc[i] ?? 0,
    ];
    for (let j = 0; j < mainN; j += 1) {
      row.push(result.mainAcc[j]?.[i] ?? 0);
    }
    for (let j = 0; j < mainN; j += 1) {
      row.push(result.mainDis[j]?.[i] ?? 0);
    }
    for (let j = 0; j < tmdN; j += 1) {
      row.push(result.tmdAcc[j]?.[i] ?? 0);
    }
    for (let j = 0; j < tmdN; j += 1) {
      row.push(result.tmdDis[j]?.[i] ?? 0);
    }
    lines.push(row.join(","));
  }

  return lines.join("\r\n");
}

export function parseResponseCsv(text: string, fallbackName: string): ResponseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 4) {
    throw new Error("結果CSVの形式が不正です。");
  }

  const line1 = parseCsvLine(lines[0]);
  const line2 = parseCsvLine(lines[1]);
  const header = parseCsvLine(lines[2]);

  const mainN = Math.floor(toNumber(line1[1] ?? "0"));
  const tmdN = Math.floor(toNumber(line2[1] ?? "0"));
  const tmdFloors: number[] = [];
  for (let i = 0; i < tmdN; i += 1) {
    const column = header[2 + mainN + mainN + i] ?? "";
    const matched = column.match(/-M(\d+)/i);
    tmdFloors.push(matched ? Number.parseInt(matched[1], 10) : i + 1);
  }

  const time: number[] = [];
  const waveAcc: number[] = [];
  const mainAcc = Array.from({ length: mainN }, () => [] as number[]);
  const mainDis = Array.from({ length: mainN }, () => [] as number[]);
  const tmdAcc = Array.from({ length: tmdN }, () => [] as number[]);
  const tmdDis = Array.from({ length: tmdN }, () => [] as number[]);

  for (const line of lines.slice(3)) {
    const columns = parseCsvLine(line);
    if (columns.length < 2 + mainN * 2) {
      continue;
    }
    let index = 0;
    time.push(toNumber(columns[index]));
    index += 1;
    waveAcc.push(toNumber(columns[index]));
    index += 1;
    for (let i = 0; i < mainN; i += 1) {
      mainAcc[i].push(toNumber(columns[index]));
      index += 1;
    }
    for (let i = 0; i < mainN; i += 1) {
      mainDis[i].push(toNumber(columns[index]));
      index += 1;
    }
    for (let i = 0; i < tmdN; i += 1) {
      tmdAcc[i].push(toNumber(columns[index]));
      index += 1;
    }
    for (let i = 0; i < tmdN; i += 1) {
      tmdDis[i].push(toNumber(columns[index]));
      index += 1;
    }
  }

  return {
    name: fallbackName,
    modelName: fallbackName,
    mainMassCount: mainN,
    tmdCount: tmdN,
    tmdFloors,
    time,
    waveAcc,
    mainAcc,
    mainDis,
    tmdAcc,
    tmdDis,
  };
}

export function parseAvdCsv(text: string): Pick<WaveAnalysisResult, "time" | "acc" | "vel" | "dis"> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const time: number[] = [];
  const acc: number[] = [];
  const vel: number[] = [];
  const dis: number[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    if (cols.length < 4) {
      continue;
    }
    time.push(toNumber(cols[0]));
    acc.push(toNumber(cols[1]));
    vel.push(toNumber(cols[2]));
    dis.push(toNumber(cols[3]));
  }
  return { time, acc, vel, dis };
}

export function parseSpectrumCsv(text: string): { period: number[]; sa: number[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const period: number[] = [];
  const sa: number[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    if (cols.length < 2) {
      continue;
    }
    period.push(toNumber(cols[0]));
    sa.push(toNumber(cols[1]));
  }
  return { period, sa };
}
