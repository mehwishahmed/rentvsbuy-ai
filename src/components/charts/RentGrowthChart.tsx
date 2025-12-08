// src/components/charts/RentGrowthChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';
import { getChartColors } from '../../lib/charts/exportChartColors';

interface RentGrowthChartProps {
  timeline: TimelinePoint[];
  isExport?: boolean;
}

export function RentGrowthChart({ timeline, isExport }: RentGrowthChartProps) {
  const colors = getChartColors(isExport);
  // Transform data - show every year
  // Mortgage payment is fixed, so use first month's value
  const monthlyMortgage = timeline[0].mortgagePayment;
  
  const chartData = timeline
    .filter((_, index) => index % 12 === 0 || index === timeline.length - 1)
    .map(point => ({
      year: point.year,
      rent: Math.round(point.rentMonthlyOutflow),
        mortgage: Math.round(monthlyMortgage)
    }));
  
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Rent Growth vs Fixed Mortgage Over {Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how rent is expected to grow over time, based on local market trends and ML estimates. Lower rent growth favors renting.
      </p>
      
      
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke={colors.axis}
            tick={{ fill: colors.text }}
          />
          <YAxis 
            label={{ value: 'Monthly Payment ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}k`;
              }
              return `$${value}`;
            }}
            stroke={colors.axis}
            tick={{ fill: colors.text }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}/mo`}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Line 
            type="monotone" 
            dataKey="rent" 
            stroke={colors.line2} 
            strokeWidth={3}
            name="Monthly Rent"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="mortgage" 
            stroke={colors.line1} 
            strokeWidth={3}
            name="Mortgage Payment"
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}