// src/components/charts/EquityBuildupChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlySnapshot } from '../../types/calculator';

interface EquityBuildupChartProps {
  data: MonthlySnapshot[];
}

export function EquityBuildupChart({ data }: EquityBuildupChartProps) {
  // Transform data - show every year
  const chartData = data
    .filter((_, index) => index % 12 === 0 || index === data.length - 1)
    .map(snapshot => {
      const year = snapshot.month / 12;
      const equity = Math.round(snapshot.homeEquity);
      const homeValue = Math.round(snapshot.homeValue);
      const percentOwned = ((equity / homeValue) * 100).toFixed(1);
      
      return {
        year: parseFloat(year.toFixed(1)),
        equity,
        homeValue,
        percentOwned: parseFloat(percentOwned)
      };
    });
  
  const finalEquity = chartData[chartData.length - 1].equity;
  const finalPercent = chartData[chartData.length - 1].percentOwned;
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Home Equity Buildup Over {Math.ceil(data.length / 12)} Years</h3>
      
      <div style={{ marginBottom: '16px', padding: '16px', background: '#f0f4ff', borderRadius: '8px', border: '2px solid #667eea' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>
          <strong>After {Math.ceil(data.length / 12)} years:</strong> You'll have <strong>${finalEquity.toLocaleString()}</strong> in equity 
          ({finalPercent}% of your home's value)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
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
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'equity') {
                return [`$${value.toLocaleString()}`, 'Home Equity'];
              }
              return value;
            }}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: 'white', border: '2px solid #667eea', borderRadius: '8px' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="#667eea" 
            strokeWidth={3}
            name="Home Equity"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
        <h4 style={{ marginBottom: '12px', color: '#2d3748' }}>What This Shows:</h4>
        <p style={{ marginBottom: '8px', lineHeight: '1.6', color: '#2d3748' }}>
          This chart shows how much of your home you actually <strong>own</strong> over time (your equity).
        </p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8', color: '#2d3748' }}>
          <li><strong>Early years (0-10):</strong> Most payments go to interest, equity builds slowly</li>
          <li><strong>Middle years (10-20):</strong> More goes to principal, equity builds faster</li>
          <li><strong>Later years (20-30):</strong> Mostly principal payments, equity accelerates</li>
        </ul>
        <p style={{ marginTop: '12px', padding: '12px', background: '#edf2f7', borderRadius: '8px', margin: 0, color: '#2d3748' }}>
          <strong>Key insight:</strong> If you sell early (5-10 years), you won't have much equity due to closing costs 
          and the fact that early payments are mostly interest!
        </p>
      </div>
      
      <p className="chart-description" style={{ marginTop: '16px' }}>
        Your equity = Home value - Remaining mortgage balance
      </p>
    </div>
  );
}