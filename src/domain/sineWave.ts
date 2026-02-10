import { DT } from "@/domain/format.ts";

export interface SineWaveInput {
  freqHz: number;
  preCycles: number;
  harmonicCycles: number;
  postCycles: number;
  addAfterObservation: boolean;
}

export function makeSineWave(input: SineWaveInput): number[] {
  const f = Math.max(0.01, input.freqHz);
  const d0 = 1.0;

  // C#実装互換: preCyclesは参照されずpostCyclesを双方に使用している。
  const n0 = Math.max(0, Math.floor(input.postCycles));
  const n1 = Math.max(1, Math.floor(input.harmonicCycles));
  const n2 = Math.max(0, Math.floor(input.postCycles));

  const ampD: number[] = [];
  for (let i = 0; i < n0; i += 1) {
    ampD.push(((i + 1) * d0) / Math.max(1, n0));
  }

  let middleCount = n1;
  if (n0 > 0) {
    middleCount -= 1;
  }
  if (n2 > 0) {
    middleCount -= 1;
  }
  for (let i = 0; i < Math.max(0, middleCount); i += 1) {
    ampD.push(d0);
  }

  const tail = [];
  for (let i = 0; i < n2; i += 1) {
    tail.push(((i + 1) * d0) / Math.max(1, n2));
  }
  ampD.push(...tail.reverse());

  const wave: number[] = [];
  const omega = 2 * Math.PI * f;
  const stepPerCycle = Math.max(1, Math.floor(1 / (f * DT)));
  for (const amp of ampD) {
    for (let i = 0; i < stepPerCycle; i += 1) {
      wave.push(amp * Math.sin(omega * i * DT));
    }
  }

  if (input.addAfterObservation) {
    for (let i = 0; i < Math.floor(5 / DT); i += 1) {
      wave.push(0);
    }
  } else {
    wave.push(0);
  }

  return wave;
}

export function createSineWaveFileName(freqHz: number, existingNames: string[]): string {
  const base = `Freq${Math.round(freqHz * 100)
    .toString()
    .padStart(4, "0")}`;
  for (let i = 1; i <= 100; i += 1) {
    const name = `${base}_${i.toString().padStart(3, "0")}.csv`;
    if (!existingNames.includes(name)) {
      return name;
    }
  }
  return `${base}_000.csv`;
}
