import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CashFlowPoint } from '../../types/calculator';
import { getChartColors } from '../../lib/charts/exportChartColors';

interface CashFlowChartProps {
  data: CashFlowPoint[];
  isExport?: boolean;
}

export function CashFlowChart({ data, isExport }: CashFlowChartProps) {
  const colors = getChartColors(isExport);
  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Cash Flow: Homeowner vs Renter</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how buying affects your monthly cash flow compared to renting. Positive values favor renting (more cash available).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="month" stroke={colors.axis} tick={{ fill: colors.text }} />
          <YAxis label={{ value: 'Monthly Cash Flow ($)', angle: -90, position: 'insideLeft' }} stroke={colors.axis} tick={{ fill: colors.text }} />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Line type="monotone" dataKey="homeownerCashFlow" stroke={colors.line1} name="Homeowner Cash Flow" dot={false} />
          <Line type="monotone" dataKey="renterCashFlow" stroke={colors.line2} name="Renter Cash Flow" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
