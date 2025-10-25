// src/components/charts/NetWorthChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlySnapshot } from '../../types/calculator';

interface NetWorthChartProps {
  data: MonthlySnapshot[];
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  // Transform data for the chart
  // We'll show data points every 12 months (yearly) to keep it clean
  const chartData = data
    .filter((_, index) => index % 12 === 0 || index === data.length - 1) // Every year + final month
    .map(snapshot => ({
      year: Math.round(snapshot.month / 12),
      buying: Math.round(snapshot.buyerNetWorth),
      renting: Math.round(snapshot.renterNetWorth)
    }));
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Net Worth Comparison Over {Math.ceil(data.length / 12)} Years</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
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
            />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="buying" 
            stroke="#667eea" 
            strokeWidth={3}
            name="Buying"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="renting" 
            stroke="#f56565" 
            strokeWidth={3}
            name="Renting"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-description">
        Blue line = Your net worth if you buy the house<br/>
        Red line = Your net worth if you rent and invest the down payment
      </p>
    </div>
  );
}