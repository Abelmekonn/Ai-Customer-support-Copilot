export function LineChart({
  labels,
  series,
  height = 220,
}: {
  labels: string[];
  series: { label: string; color: string; values: number[] }[];
  height?: number;
}) {
  const width = 640;
  const pad = { left: 28, right: 8, top: 16, bottom: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const count = Math.max(labels.length, 1);
  const max = Math.max(1, ...series.flatMap((item) => item.values));

  function x(index: number) {
    if (count <= 1) return pad.left;
    return pad.left + (index / (count - 1)) * innerW;
  }

  function y(value: number) {
    return pad.top + innerH - (value / max) * innerH;
  }

  function points(values: number[]) {
    return values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  }

  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: pad.top + innerH * (1 - ratio),
    label: String(Math.round(max * ratio)),
  }));
  const xTicks = [0, Math.floor((count - 1) / 2), count - 1].filter(
    (index, pos, list) => list.indexOf(index) === pos,
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" role="img">
      {ticks.map((tick) => (
        <g key={tick.y}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={tick.y}
            y2={tick.y}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="2 6"
          />
          <text
            x={pad.left - 8}
            y={tick.y + 3}
            textAnchor="end"
            fill="rgba(255,255,255,0.3)"
            fontSize="10"
          >
            {tick.label}
          </text>
        </g>
      ))}
      {series.map((item) => (
        <polyline
          key={item.label}
          fill="none"
          stroke={item.color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points(item.values)}
        />
      ))}
      {series.map((item) => {
        const last = item.values.length - 1;
        return (
          <circle
            key={`${item.label}-end`}
            cx={x(last)}
            cy={y(item.values[last] ?? 0)}
            r="3.5"
            fill={item.color}
          />
        );
      })}
      {xTicks.map((index) => (
        <text
          key={labels[index] ?? index}
          x={x(index)}
          y={height - 10}
          textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
          fill="rgba(255,255,255,0.35)"
          fontSize="11"
        >
          {labels[index]}
        </text>
      ))}
    </svg>
  );
}

export function DonutChart({
  parts,
  total,
  size = 148,
}: {
  parts: { label: string; value: number; color: string }[];
  total: number;
  size?: number;
}) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <svg width={size} height={size} className="shrink-0" aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      </svg>
    );
  }

  const segments: { label: string; color: string; len: number; dashOffset: number }[] = [];
  let cursor = 0;
  for (const part of parts) {
    if (part.value <= 0) continue;
    const len = (part.value / total) * circ;
    segments.push({ label: part.label, color: part.color, len, dashOffset: -cursor });
    cursor += len;
  }

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      {segments.map((segment) => (
        <circle
          key={segment.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={segment.color}
          strokeWidth={stroke}
          strokeDasharray={`${segment.len} ${circ - segment.len}`}
          strokeDashoffset={segment.dashOffset}
        />
      ))}
    </svg>
  );
}
