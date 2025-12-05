import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SensitivityResult } from '../../types/calculator';
import { getChartColors } from '../../lib/charts/exportChartColors';

interface SensitivityChartProps {
  results: SensitivityResult[];
  isExport?: boolean;
}

export function SensitivityChart({ results, isExport }: SensitivityChartProps) {
  const colors = getChartColors(isExport);
  // Show net worth delta for each variant
  const data = results.map(r => ({
    variant: r.variant,
    netWorthDelta: r.output.summary.finalNetWorthDelta,
    buyerNetWorth: r.output.summary.finalBuyerNetWorth,
    renterNetWorth: r.output.summary.finalRenterNetWorth
  }));
  return (
    <div className="chart-container">
      <h3 className="chart-title">Sensitivity Analysis: Parameter Sweep</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how changing one variable (interest, home price, rent) affects your decision.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="variant" stroke={colors.axis} tick={{ fill: colors.text }} />
          <YAxis label={{ value: 'Net Worth Δ ($)', angle: -90, position: 'insideLeft' }} stroke={colors.axis} tick={{ fill: colors.text }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }} />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Bar dataKey="netWorthDelta" name="Net Worth Delta" fill={colors.bar1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
