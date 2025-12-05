// src/components/charts/MonthlyCostChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';
import { getChartColors, getChartContainerStyles, getChartTitleStyles, getChartCaptionStyles } from '../../lib/charts/exportChartColors';

interface MonthlyCostChartProps {
  timeline: TimelinePoint[];
  isExport?: boolean;
}

export function MonthlyCostChart({ timeline, isExport }: MonthlyCostChartProps) {
  const colors = getChartColors(isExport);
  // Use first month's data for monthly costs
  const firstPoint = timeline[0];
  
  const buyingCosts = {
    mortgage: firstPoint.mortgagePayment,
    propertyTax: firstPoint.propertyTaxMonthly,
    insurance: firstPoint.insuranceMonthly,
    hoa: firstPoint.hoaMonthly,
    maintenance: firstPoint.maintenanceMonthly,
    total: firstPoint.buyMonthlyOutflow,
  };
  
  const rentingCosts = {
    rent: firstPoint.rentMonthlyOutflow,
    insurance: 0, // Not tracked in unified structure
    total: firstPoint.rentMonthlyOutflow,
  };
  // Prepare data for the chart
  const data = [
    {
      name: 'Buying',
      total: Math.round(buyingCosts.total),
      color: colors.bar1
    },
    {
      name: 'Renting',
      total: Math.round(rentingCosts.total),
      color: colors.bar2
    }
  ];
  
  const containerStyles = getChartContainerStyles(isExport);
  const titleStyles = getChartTitleStyles(isExport);
  const captionStyles = getChartCaptionStyles(isExport);
  
  return (
    <div className="chart-container" style={containerStyles}>
      <h3 className="chart-title" style={titleStyles}>Monthly Cost Comparison</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5', ...captionStyles }}>
        This compares your monthly cost of buying (mortgage + taxes + other costs) versus renting. Lower bars are better.
      </p>
      
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="name" stroke={colors.axis} tick={{ fill: colors.text }} />
          <YAxis 
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
            contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '10px', color: colors.tooltipText }}
          />
          <Legend wrapperStyle={{ color: colors.text }} />
          <Bar dataKey="total" name="Monthly Cost" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}