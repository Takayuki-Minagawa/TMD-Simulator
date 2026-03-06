import { useEffect, useMemo, useRef, useState } from "react";
import type { ResponseResult } from "@/domain/types";
import { DT } from "@/domain/format";

interface BuildingAnimationProps {
  result: ResponseResult;
  translations: {
    play: string;
    pause: string;
    reset: string;
    speed: string;
    time: string;
  };
}

const FLOOR_COLORS = [
  "#d1495b", "#2b59c3", "#00798c", "#f18f01", "#8e6c88",
  "#e63946", "#457b9d", "#2a9d8f", "#e9c46a",
];

export function BuildingAnimation({ result, translations: tt }: BuildingAnimationProps) {
  const { mainMassCount, mainDis, time } = result;
  const totalSteps = time.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animRef = useRef<number>(0);

  const maxAbsDis = useMemo(() => {
    let max = 0;
    for (const floorDis of mainDis) {
      for (const val of floorDis) {
        const abs = Math.abs(val);
        if (abs > max) max = abs;
      }
    }
    return max || 1;
  }, [mainDis]);

  const storyHeight = 1;
  const totalHeight = mainMassCount * storyHeight;
  const disScale = 1.5 / maxAbsDis;

  const margin = 0.8;
  const viewWidth = 5;
  const viewHeight = totalHeight + 2 * margin;

  const svgPixelHeight = Math.min(500, Math.max(250, 65 * (mainMassCount + 1)));
  const svgPixelWidth = svgPixelHeight * (viewWidth / viewHeight);

  useEffect(() => {
    if (!playing) return;

    let prevTimestamp: number | null = null;
    let accumulator = 0;
    const stepInterval = DT / speed;

    const animate = (timestamp: number) => {
      if (prevTimestamp !== null) {
        const elapsed = (timestamp - prevTimestamp) / 1000;
        accumulator += elapsed;
        const stepsToAdvance = Math.floor(accumulator / stepInterval);
        if (stepsToAdvance > 0) {
          setCurrentStep((prev) => {
            const next = prev + stepsToAdvance;
            if (next >= totalSteps) {
              setPlaying(false);
              return totalSteps - 1;
            }
            return next;
          });
          accumulator -= stepsToAdvance * stepInterval;
        }
      }
      prevTimestamp = timestamp;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, speed, totalSteps]);

  const floorPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (let i = 0; i < mainMassCount; i++) {
      const dis = mainDis[i]?.[currentStep] ?? 0;
      positions.push({
        x: dis * disScale,
        y: (i + 1) * storyHeight,
      });
    }
    return positions;
  }, [currentStep, mainDis, mainMassCount, disScale, storyHeight]);

  const toSvgY = (logicalY: number) => totalHeight - logicalY;

  return (
    <div className="building-animation">
      <div className="row" style={{ alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => setPlaying(!playing)}
          style={{ minWidth: "36px" }}
        >
          {playing ? "||" : tt.play}
        </button>
        <button
          onClick={() => { setCurrentStep(0); setPlaying(false); }}
          style={{ minWidth: "36px" }}
        >
          {tt.reset}
        </button>
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStep}
          onChange={(e) => { setPlaying(false); setCurrentStep(Number(e.target.value)); }}
          style={{ flex: 1, minWidth: "120px" }}
        />
        <span style={{ fontFamily: "monospace", minWidth: "60px" }}>
          {(currentStep * DT).toFixed(2)}s
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {tt.speed}
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={0.25}>x0.25</option>
            <option value={0.5}>x0.5</option>
            <option value={1}>x1</option>
            <option value={2}>x2</option>
            <option value={4}>x4</option>
          </select>
        </label>
      </div>

      <svg
        width={Math.max(svgPixelWidth, 200)}
        height={svgPixelHeight}
        viewBox={`${-viewWidth / 2} ${-margin} ${viewWidth} ${viewHeight}`}
        style={{ border: "1px solid var(--border)", borderRadius: "4px", background: "var(--panel-bg, #fff)", display: "block", margin: "8px 0" }}
      >
        {/* Ground hatch */}
        <line
          x1={-viewWidth / 2 + 0.3}
          y1={toSvgY(0)}
          x2={viewWidth / 2 - 0.3}
          y2={toSvgY(0)}
          stroke="var(--text-muted, #666)"
          strokeWidth="0.04"
        />
        {Array.from({ length: 15 }).map((_, i) => {
          const xStart = -viewWidth / 2 + 0.3 + i * 0.3;
          return (
            <line
              key={`hatch-${i}`}
              x1={xStart}
              y1={toSvgY(0)}
              x2={xStart - 0.15}
              y2={toSvgY(-0.2)}
              stroke="var(--text-muted, #888)"
              strokeWidth="0.02"
            />
          );
        })}

        {/* Center reference line */}
        <line
          x1={0} y1={toSvgY(0)} x2={0} y2={toSvgY(totalHeight)}
          stroke="var(--text-muted, #ccc)"
          strokeWidth="0.015"
          strokeDasharray="0.08,0.08"
        />

        {/* Undeformed floor level lines */}
        {Array.from({ length: mainMassCount }).map((_, i) => (
          <line
            key={`level-${i}`}
            x1={-0.3}
            y1={toSvgY((i + 1) * storyHeight)}
            x2={0.3}
            y2={toSvgY((i + 1) * storyHeight)}
            stroke="var(--text-muted, #ddd)"
            strokeWidth="0.015"
          />
        ))}

        {/* Building lines connecting floors */}
        {floorPositions.map((pos, i) => {
          if (i === 0) return null;
          const prev = floorPositions[i - 1];
          return (
            <line
              key={`seg-${i}`}
              x1={prev.x}
              y1={toSvgY(prev.y)}
              x2={pos.x}
              y2={toSvgY(pos.y)}
              stroke="#2b59c3"
              strokeWidth="0.07"
              strokeLinecap="round"
            />
          );
        })}

        {/* Floor mass markers */}
        {floorPositions.map((pos, i) => (
          <g key={`node-${i}`}>
            <circle
              cx={pos.x}
              cy={toSvgY(pos.y)}
              r={i === 0 ? 0.08 : 0.12}
              fill={i === 0 ? "var(--text-muted, #666)" : FLOOR_COLORS[(i - 1) % FLOOR_COLORS.length]}
            />
            <text
              x={-viewWidth / 2 + 0.4}
              y={toSvgY(pos.y) + 0.08}
              fontSize="0.22"
              fill="var(--text-color, #333)"
            >
              {i === 0 ? "GL" : i === mainMassCount ? "RF" : `${i + 1}F`}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
