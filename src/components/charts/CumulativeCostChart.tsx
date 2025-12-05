import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CumulativeCostPoint } from '../../types/calculator';
import { getChartColors } from '../../lib/charts/exportChartColors';

interface CumulativeCostChartProps {
  data: CumulativeCostPoint[];
  isExport?: boolean;
}

export function CumulativeCostChart({ data, isExport }: CumulativeCostChartProps) {
  const colors = getChartColors(isExport);
  return (
    <div className="chart-container">
      <h3 className="chart-title">Cumulative Total Costs: Buying vs Renting</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how your total spending accumulates over time for buying versus renting. Lower lines are better.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="month" stroke={colors.axis} tick={{ fill: colors.text }} />
          <YAxis label={{ value: 'Cumulative Cost ($)', angle: -90, position: 'insideLeft' }} stroke={colors.axis} tick={{ fill: colors.text }} />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Line type="monotone" dataKey="cumulativeBuying" stroke={colors.line1} name="Buying (Cumulative)" dot={false} />
          <Line type="monotone" dataKey="cumulativeRenting" stroke={colors.line2} name="Renting (Cumulative)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
