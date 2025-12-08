// src/components/charts/NetWorthChart.tsx

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';
import { getChartColors, getChartContainerStyles, getChartTitleStyles, getChartCaptionStyles } from '../../lib/charts/exportChartColors';

interface NetWorthChartProps {
  timeline: TimelinePoint[];
  isExport?: boolean;
}

export function NetWorthChart({ timeline, isExport }: NetWorthChartProps) {
  const colors = getChartColors(isExport);
  // Transform data for the chart - memoize to prevent infinite re-renders
  // We'll show data points every 12 months (yearly) to keep it clean
  const chartData = useMemo(() => {
    return timeline
      .filter((_, index) => index % 12 === 0 || index === timeline.length - 1) // Every year + final month
      .map(point => {
        // Handle both camelCase and snake_case from backend
        const netWorthBuy = (point as any).net_worth_buy ?? point.netWorthBuy ?? 0;
        const netWorthRent = (point as any).net_worth_rent ?? point.netWorthRent ?? 0;
        const year = point.year ?? Math.ceil(((point as any).month_index ?? (point as any).monthIndex ?? 0) / 12);
        
        return {
          year,
          buying: Math.round(netWorthBuy),
          renting: Math.round(netWorthRent)
        };
      });
  }, [timeline]);
  
  const containerStyles = getChartContainerStyles(isExport);
  const titleStyles = getChartTitleStyles(isExport);
  const captionStyles = getChartCaptionStyles(isExport);
  
  return (
    <div className="chart-container" style={containerStyles}>
      <h3 className="chart-title" style={titleStyles}>Net Worth Comparison Over {Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5', ...captionStyles }}>
        This shows how your net worth changes over time if you buy versus rent. Higher lines are better.
      </p>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke={colors.axis}
            tick={{ fill: colors.text }}
          />
            <YAxis 
            label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }}
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
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend 
            wrapperStyle={{ color: colors.text, marginTop: '20px' }} 
          />
          <Line 
            type="monotone" 
            dataKey="buying" 
            stroke={colors.line1} 
            strokeWidth={3}
            name="Buying"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="renting" 
            stroke={colors.line2} 
            strokeWidth={3}
            name="Renting"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}