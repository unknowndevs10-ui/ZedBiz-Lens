import { useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COLORS } from '../../utils/theme';
import { formatCompactKwacha, formatKwacha } from '../../utils/format';

const SERIES = [
  { key: 'revenue', label: 'Revenue', color: COLORS.primary },
  { key: 'expenses', label: 'Expenses', color: COLORS.accent },
  { key: 'net', label: 'Net profit', color: COLORS.ink },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-bold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
            {SERIES.find((s) => s.key === p.dataKey)?.label}
          </span>
          <span className="font-bold tabular-nums">{formatKwacha(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Interactive: hover for exact figures, toggle series on and off. */
export default function RevenueExpenseChart({ series }) {
  const [visible, setVisible] = useState({ revenue: true, expenses: true, net: true });
  const toggle = (key) => setVisible((v) => (Object.values(v).filter(Boolean).length === 1 && v[key] ? v : { ...v, [key]: !v[key] }));

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Chart series">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={visible[s.key]}
            onClick={() => toggle(s.key)}
            className={`inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-[13px] font-semibold focus-ring ${visible[s.key] ? 'border-line bg-white text-ink' : 'border-transparent bg-surface text-ink-muted'}`}
          >
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: visible[s.key] ? s.color : '#c3cfd1' }} aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-4 h-64 sm:h-72" role="img" aria-label="Revenue, expenses and net profit over the selected period">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={COLORS.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} axisLine={{ stroke: COLORS.line }} interval="preserveStartEnd" minTickGap={28} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} axisLine={false} tickFormatter={formatCompactKwacha} width={52} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(31,111,107,0.06)' }} />
            {visible.revenue && <Bar dataKey="revenue" fill={COLORS.primary} radius={[2, 2, 0, 0]} maxBarSize={22} isAnimationActive={false} />}
            {visible.expenses && <Bar dataKey="expenses" fill={COLORS.accent} radius={[2, 2, 0, 0]} maxBarSize={22} isAnimationActive={false} />}
            {visible.net && <Line type="monotone" dataKey="net" stroke={COLORS.ink} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
