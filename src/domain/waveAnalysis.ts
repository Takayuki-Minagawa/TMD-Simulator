import type { WaveAnalysisResult } from "@/domain/types.ts";

interface ComplexNumber {
  r: number;
  i: number;
}

interface SpectrumResult {
  period: number[];
  rows: number[][];
}

interface IntegrationResult {
  time: number[];
  acc: number[];
  vel: number[];
  dis: number[];
}

const PI = 3.14159265358979;
const LOG10 = 2.302585093;
const NSP = 200;
const DT = 0.01;
const SAMPLING = 100;

function complex(r = 0, i = 0): ComplexNumber {
  return { r, i };
}

function fft(ind: number, a0: ComplexNumber[]): ComplexNumber[] {
  const nb = a0.length;
  const a: ComplexNumber[] = new Array(nb + 1).fill(0).map(() => complex());
  const b: ComplexNumber[] = new Array(nb).fill(0).map(() => complex());
  for (let i = 1; i <= nb; i += 1) {
    a[i] = complex(a0[i - 1].r, a0[i - 1].i);
  }

  let n = 0;
  let nLoop = 1;
  do {
    n += 1;
    nLoop *= 2;
  } while (nb !== nLoop);

  if (ind === -1) {
    for (let j = 1; j <= nb; j += 1) {
      a[j].r /= nb;
      a[j].i /= nb;
    }
  }

  const nbd2 = nb / 2;
  const nbm1 = nb - 1;
  let j = 1;
  for (let l = 1; l <= nbm1; l += 1) {
    if (l < j) {
      const tr = a[j].r;
      const ti = a[j].i;
      a[j].r = a[l].r;
      a[j].i = a[l].i;
      a[l].r = tr;
      a[l].i = ti;
    }
    let k = nbd2;
    while (k < j) {
      j -= k;
      k /= 2;
    }
    j += k;
  }

  for (let m = 1; m <= n; m += 1) {
    const k = 2 ** (m - 1);
    const mme = 2 ** m;
    let ur = 1;
    let ui = 0;
    const wr = Math.cos(Math.PI / k);
    const wi = ind * Math.sin(Math.PI / k);

    for (j = 1; j <= k; j += 1) {
      for (let l = j; l <= nb; l += mme) {
        const lpk = l + k;
        const tr = a[lpk].r * ur - a[lpk].i * ui;
        const ti = a[lpk].i * ur + a[lpk].r * ui;
        a[lpk].r = a[l].r - tr;
        a[lpk].i = a[l].i - ti;
        a[l].r += tr;
        a[l].i += ti;
      }
      const sr = ur;
      ur = ur * wr - ui * wi;
      ui = ui * wr + sr * wi;
    }
  }

  for (let i = 0; i < nb; i += 1) {
    b[i] = complex(a[i + 1].r, a[i + 1].i);
  }
  return b;
}

function bandPassFilter(f: number, fl: number, fh: number, df: number): number {
  const bh = 2.5 * (200 / df);
  const bl = fl / 2;
  let filter = 1;

  if (fh > 1e-5) {
    if (f > fh + 0.7 * bh) {
      filter = 0;
    } else if (f < fh - 0.3 * bh) {
      filter = 1;
    } else {
      filter = 0.5 * (1 + Math.sin((PI / bh) * (f - fh + 0.3 * bh) + 0.5 * PI));
    }
  }

  if (fl > 1e-5) {
    if (f > fl + 0.3 * bl) {
      filter *= 1;
    } else if (f < fl - 0.7 * bl) {
      filter = 0;
    } else {
      filter *= 0.5 * (1 - Math.sin((PI / bl) * (f - fl + 0.7 * bl) + 0.5 * PI));
    }
  }

  return filter;
}

function integrateWave(wave: number[], biasFilter = true): IntegrationResult {
  const average = wave.reduce((sum, value) => sum + value, 0) / Math.max(1, wave.length);
  const padded = [...wave];
  let nb = 2;
  while (nb < padded.length) {
    nb *= 2;
  }
  while (padded.length < nb) {
    padded.push(biasFilter ? average : 0);
  }

  let acc = padded.map((value) => complex(biasFilter ? value - average : value, 0));
  let vel = padded.map(() => complex(0, 0));
  let dis = padded.map(() => complex(0, 0));

  acc = fft(-1, acc);

  const f0 = SAMPLING / nb;
  const fl = 0.5;
  const fh = SAMPLING / 2;
  acc[0] = complex(0, 0);
  for (let i = 1; i <= nb / 2; i += 1) {
    const frq = f0 * i;
    const filter = bandPassFilter(frq, fl, fh, SAMPLING);
    acc[i].r *= filter;
    acc[i].i *= filter;
  }

  for (let i = 1; i <= nb / 2; i += 1) {
    const frq = f0 * i;
    const w = 2 * PI * frq;
    const w2 = w * w;
    vel[i].r = (1 / w) * acc[i].i;
    vel[i].i = (-1 / w) * acc[i].r;
    dis[i].r = (-1 / w2) * acc[i].r;
    dis[i].i = (-1 / w2) * acc[i].i;

    if (i < nb / 2) {
      const j = nb - i;
      acc[j].r = acc[i].r;
      acc[j].i = -acc[i].i;
      vel[j].r = vel[i].r;
      vel[j].i = -vel[i].i;
      dis[j].r = dis[i].r;
      dis[j].i = -dis[i].i;
    }
  }

  acc = fft(1, acc);
  vel = fft(1, vel);
  dis = fft(1, dis);

  const time = Array.from({ length: nb }, (_, i) => i / SAMPLING);
  return {
    time,
    acc: acc.map((value) => value.r),
    vel: vel.map((value) => value.r),
    dis: dis.map((value) => value.r),
  };
}

function nigamMethod(wv: number[], period: number, damping: number) {
  const pi2 = 6.283185307;
  let amax = 0;
  let vmax = 0;
  let dmax = 0;
  let ee = 0;

  const w = pi2 / period;
  const w2 = w * w;
  const hw = damping * w;
  const wd = w * Math.sqrt(1 - damping * damping);
  const wdt = wd * DT;
  const e = Math.exp(-hw * DT);
  const cwdt = Math.cos(wdt);
  const swdt = Math.sin(wdt);
  const a11 = e * (cwdt + (hw * swdt) / wd);
  const a12 = (e * swdt) / wd;
  const a21 = (-e * w2 * swdt) / wd;
  const a22 = e * (cwdt - (hw * swdt) / wd);
  const ss = -hw * swdt - wd * cwdt;
  const cc = -hw * cwdt + wd * swdt;
  const s1 = (e * ss + wd) / w2;
  const c1 = (e * cc + hw) / w2;
  const s2 = (e * DT * ss + hw * s1 + wd * c1) / w2;
  const c2 = (e * DT * cc + hw * c1 - wd * s1) / w2;
  const s3 = DT * s1 - s2;
  const c3 = DT * c1 - c2;
  const b11 = -s2 / wdt;
  const b12 = -s3 / wdt;
  const b21 = (hw * s2 - wd * c2) / wdt;
  const b22 = (hw * s3 - wd * c3) / wdt;

  let dxf = -wv[0] * DT;
  let xf = 0;
  amax = Math.abs(2 * hw * wv[0] * DT);
  vmax = Math.abs(wv[0] * DT);
  dmax = 0;
  ee = vmax * wv[0] * DT;

  for (let m = 1; m < wv.length; m += 1) {
    const ddym = wv[m];
    const ddyf = wv[m - 1];
    const x = a12 * dxf + a11 * xf + b12 * ddym + b11 * ddyf;
    const dx = a22 * dxf + a21 * xf + b22 * ddym + b21 * ddyf;
    const ddx = -2 * hw * dx - w2 * x;
    ee += dx * ddym * DT;
    amax = Math.max(amax, Math.abs(ddx));
    vmax = Math.max(vmax, Math.abs(dx));
    dmax = Math.max(dmax, Math.abs(x));
    dxf = dx;
    xf = x;
  }

  return { amax, vmax, dmax, ee };
}

function calculateSpectrum(wave: number[], dampingList: number[]): SpectrumResult {
  const sTime = 0.02;
  const eTime = 10.0;
  const period: number[] = [];
  const div = (Math.log(eTime) / LOG10 - Math.log(sTime) / LOG10) / NSP;
  const logs = Math.log(sTime) / LOG10;

  const rows: number[][] = [];
  for (let it = 0; it <= NSP; it += 1) {
    let t = 10 ** (logs + div * it);
    if (it === 0) {
      t = sTime;
    } else if (it === NSP) {
      t = eTime;
    }
    period.push(t);
  }

  for (let it = 0; it <= NSP; it += 1) {
    const row = [period[it]];
    for (const h of dampingList) {
      const response = nigamMethod(wave, period[it], h);
      row.push(response.amax);
      row.push(response.vmax);
      row.push(response.dmax);
      row.push((response.amax * period[it]) / (2 * Math.PI));
      row.push(Math.sqrt(2 * Math.abs(response.ee)));
    }
    rows.push(row);
  }

  return { period, rows };
}

export function createAvdCsv(data: IntegrationResult): string {
  const lines = ["Time(s),A(gal),V(kine),D(cm)"];
  for (let i = 0; i < data.time.length; i += 1) {
    lines.push(`${data.time[i]},${data.acc[i]},${data.vel[i]},${data.dis[i]}`);
  }
  return lines.join("\n");
}

export function createSpectrumCsv(
  spectrum: SpectrumResult,
  dampingList: number[],
): string {
  const header = ["Period(s)"];
  for (const h of dampingList) {
    header.push(`Sa_${h.toFixed(3)}`);
    header.push(`Sv_${h.toFixed(3)}`);
    header.push(`Sd_${h.toFixed(3)}`);
    header.push(`pSv_${h.toFixed(3)}`);
    header.push(`Ve_${h.toFixed(3)}`);
  }
  const lines = [header.join(",")];
  for (const row of spectrum.rows) {
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export function analyzeWave(wave: number[], dampingList = [0.05]): WaveAnalysisResult {
  const integration = integrateWave(wave, true);
  const spectrum = calculateSpectrum(wave, dampingList);
  const sa = spectrum.rows.map((row) => row[1] ?? 0);
  const maxAbs = (data: number[]) =>
    data.reduce((current, value) => Math.max(current, Math.abs(value)), 0);

  return {
    time: integration.time,
    acc: integration.acc,
    vel: integration.vel,
    dis: integration.dis,
    period: spectrum.period,
    sa,
    spectrumRows: spectrum.rows,
    amax: maxAbs(integration.acc),
    vmax: maxAbs(integration.vel),
    dmax: maxAbs(integration.dis),
  };
}
