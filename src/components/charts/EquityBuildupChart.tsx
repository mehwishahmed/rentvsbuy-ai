// src/components/charts/EquityBuildupChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';
import { getChartColors } from '../../lib/charts/exportChartColors';

interface EquityBuildupChartProps {
  timeline: TimelinePoint[];
  isExport?: boolean;
}

export function EquityBuildupChart({ timeline, isExport }: EquityBuildupChartProps) {
  const colors = getChartColors(isExport);
  // Transform data - show every year
  const chartData = timeline
    .filter((_, index) => index % 12 === 0 || index === timeline.length - 1)
    .map(point => {
      const equity = Math.round(point.homeEquity);
      const homeValue = Math.round(point.homeValue);
      const percentOwned = ((equity / homeValue) * 100).toFixed(1);
      
      return {
        year: point.year,
        equity,
        homeValue,
        percentOwned: parseFloat(percentOwned)
      };
    });

  return (
    <div className="chart-container">
      <h3 className="chart-title">Home Equity Buildup Over {Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how much of the home you actually own (equity) over time when you buy. Higher is better.
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke={colors.axis}
            tick={{ fill: colors.text }}
          />
          <YAxis 
            label={{ value: 'Home Equity ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}k`;
              }
              return `$${value}`;
            }}
            stroke={colors.axis}
            tick={{ fill: colors.text }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'equity') {
                return [`$${value.toLocaleString()}`, 'Home Equity'];
              }
              return value;
            }}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke={colors.line1} 
            strokeWidth={3}
            name="Home Equity"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}