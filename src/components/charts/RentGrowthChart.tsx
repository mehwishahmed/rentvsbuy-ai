// src/components/charts/RentGrowthChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlySnapshot } from '../../types/calculator';

interface RentGrowthChartProps {
  data: MonthlySnapshot[];
  monthlyMortgage: number; // Fixed mortgage payment
}

export function RentGrowthChart({ data, monthlyMortgage }: RentGrowthChartProps) {
  // Transform data - show every year
  const chartData = data
    .filter((_, index) => index % 12 === 0 || index === data.length - 1)
    .map(snapshot => {
      const year = snapshot.month / 12;
      
      return {
        year: parseFloat(year.toFixed(1)),
        rent: Math.round(snapshot.monthlyRent),
        mortgage: Math.round(monthlyMortgage)
      };
    });
  
  const finalRent = chartData[chartData.length - 1].rent;
  const rentIncrease = finalRent - chartData[0].rent;
  const percentIncrease = ((rentIncrease / chartData[0].rent) * 100).toFixed(0);
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Rent Growth vs Fixed Mortgage Over 30 Years</h3>
      
      <div style={{ marginBottom: '16px', padding: '16px', background: '#fff4e6', borderRadius: '8px', border: '2px solid #f59e0b' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>
          <strong>Rent grows {percentIncrease}%</strong> over 30 years 
          (from <strong>${chartData[0].rent.toLocaleString()}/mo</strong> to <strong>${finalRent.toLocaleString()}/mo</strong>), 
          while your mortgage stays fixed at <strong>${monthlyMortgage.toLocaleString()}/mo</strong>
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
            label={{ value: 'Monthly Payment ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}k`;
              }
              return `$${value}`;
            }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}/mo`}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: 'white', border: '2px solid #667eea', borderRadius: '8px' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="rent" 
            stroke="#f56565" 
            strokeWidth={3}
            name="Monthly Rent"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="mortgage" 
            stroke="#667eea" 
            strokeWidth={3}
            name="Mortgage Payment"
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
        <h4 style={{ marginBottom: '12px', color: '#2d3748' }}>What This Shows:</h4>
        <p style={{ marginBottom: '8px', lineHeight: '1.6', color: '#2d3748' }}>
          This illustrates the <strong>"rent trap"</strong> - rent increases every year (typically 3-4%), 
          while your mortgage payment stays the same for 30 years.
        </p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8', color: '#2d3748' }}>
          <li><strong>Red line (Rent):</strong> Climbs steadily due to inflation</li>
          <li><strong>Blue line (Mortgage):</strong> Flat - locked in at today's rate</li>
        </ul>
        <p style={{ marginTop: '12px', padding: '12px', background: '#edf2f7', borderRadius: '8px', margin: 0, color: '#2d3748' }}>
          <strong>Key insight:</strong> Even if buying costs more TODAY, it might be cheaper TOMORROW 
          because your housing cost is locked in while rent keeps rising!
        </p>
      </div>
      
      <p className="chart-description" style={{ marginTop: '16px' }}>
        Rent grows at 3.5% annually. Your mortgage stays fixed.
      </p>
    </div>
  );
}