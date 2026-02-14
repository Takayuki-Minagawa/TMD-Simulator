import { Suspense, lazy } from "react";

const Plot = lazy(() => import("react-plotly.js"));

export interface LineSeries {
  name: string;
  x: number[];
  y: number[];
  color?: string;
}

interface LineChartProps {
  title: string;
  xLabel: string;
  yLabel: string;
  series: LineSeries[];
  height?: number;
}

export function LineChart({
  title,
  xLabel,
  yLabel,
  series,
  height = 320,
}: LineChartProps) {
  if (series.length === 0) {
    return <div className="empty-plot">表示データがありません。</div>;
  }

  return (
    <Suspense fallback={<div className="empty-plot">グラフを読み込み中です...</div>}>
      <Plot
        data={series.map((item) => ({
          x: item.x,
          y: item.y,
          mode: "lines",
          type: "scatter",
          name: item.name,
          line: item.color ? { color: item.color, width: 2 } : { width: 2 },
        }))}
        layout={{
          title: { text: title },
          autosize: true,
          height,
          margin: { l: 60, r: 20, t: 50, b: 60 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(255,255,255,0.82)",
          xaxis: { title: { text: xLabel }, gridcolor: "#dbe7f4" },
          yaxis: { title: { text: yLabel }, gridcolor: "#dbe7f4" },
          legend: { orientation: "h" },
        }}
        config={{ displaylogo: false, responsive: true }}
        style={{ width: "100%" }}
        useResizeHandler
      />
    </Suspense>
  );
}
