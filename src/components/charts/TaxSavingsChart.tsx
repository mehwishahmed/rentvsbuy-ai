import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TaxSavingsPoint } from '../../types/calculator';
import { getChartColors } from '../../lib/charts/exportChartColors';

interface TaxSavingsChartProps {
  data: TaxSavingsPoint[];
  isExport?: boolean;
}

export function TaxSavingsChart({ data, isExport }: TaxSavingsChartProps) {
  const colors = getChartColors(isExport);
  return (
    <div className="chart-container">
      <h3 className="chart-title">Annual Tax Savings from Buying</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows estimated tax savings from owning a home versus renting. Higher bars mean more tax savings (better).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="year" stroke={colors.axis} tick={{ fill: colors.text }} />
          <YAxis label={{ value: 'Annual Tax Savings ($)', angle: -90, position: 'insideLeft' }} stroke={colors.axis} tick={{ fill: colors.text }} />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Bar dataKey="deductibleMortgageInterest" name="Deductible Mortgage Interest" fill={colors.bar1} />
          <Bar dataKey="deductiblePropertyTax" name="Deductible Property Tax" fill={colors.bar2} />
          <Bar dataKey="totalTaxBenefit" name="Total Tax Benefit" fill={isExport ? '#666666' : 'rgba(149, 128, 210, 0.55)'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
