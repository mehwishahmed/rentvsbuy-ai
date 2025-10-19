// src/components/charts/TotalCostChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface TotalCostChartProps {
  buyerFinalNetWorth: number;
  renterFinalNetWorth: number;
  totalBuyingCosts: number;
  totalRentingCosts: number;
  finalHomeValue: number;
  finalInvestmentValue: number;
}

export function TotalCostChart({
  buyerFinalNetWorth,
  renterFinalNetWorth,
  totalBuyingCosts,
  totalRentingCosts,
  finalHomeValue,
  finalInvestmentValue
}: TotalCostChartProps) {
  
  // Calculate net cost (what you spent minus what you have)
  const buyingNetCost = totalBuyingCosts - finalHomeValue;
  const rentingNetCost = totalRentingCosts - finalInvestmentValue;
  
  const winner = buyerFinalNetWorth > renterFinalNetWorth ? 'Buying' : 'Renting';
  const savings = Math.abs(buyerFinalNetWorth - renterFinalNetWorth);

  const data = [
    {
      name: 'Buying',
      netCost: Math.round(buyingNetCost),
      spent: Math.round(totalBuyingCosts),
      value: Math.round(finalHomeValue)
    },
    {
      name: 'Renting',
      netCost: Math.round(rentingNetCost),
      spent: Math.round(totalRentingCosts),
      value: Math.round(finalInvestmentValue)
    }
  ];
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">30-Year Total Cost Comparison</h3>
      
      <div className="breakeven-callout" style={{ 
        background: winner === 'Buying' 
          ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' 
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <p>🏆 <strong>{winner} saves you ${savings.toLocaleString()} over 30 years!</strong></p>
        <p>The net cost of {winner.toLowerCase()} is ${savings.toLocaleString()} lower.</p>      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" />
          <YAxis 
            label={{ value: 'Net Cost ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (Math.abs(value) >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (Math.abs(value) >= 1000) {
                return `$${(value / 1000).toFixed(0)}k`;
              }
              return `$${value}`;
            }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'white', border: '2px solid #667eea', borderRadius: '8px' }}
          />
          <Legend />
          <Bar dataKey="netCost" name="Net Cost (after 30 years)" radius={[8, 8, 0, 0]}>
            <Cell fill="#667eea" />
            <Cell fill="#f56565" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center' }}>
          <div>
            <h4 style={{ color: '#667eea', marginBottom: '8px' }}>💰 Buying Breakdown</h4>
            <p style={{ color: 'black' }}><strong>Total Spent:</strong> ${totalBuyingCosts.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Home Value:</strong> ${finalHomeValue.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Net Cost:</strong> ${Math.round(buyingNetCost).toLocaleString()}</p>
          </div>
          <div>
            <h4 style={{ color: '#f56565', marginBottom: '8px' }}>🏠 Renting Breakdown</h4>
            <p style={{ color: 'black' }}><strong>Total Spent:</strong> ${totalRentingCosts.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Investment Value:</strong> ${finalInvestmentValue.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Net Cost:</strong> ${Math.round(rentingNetCost).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <p className="chart-description" style={{ marginTop: '16px' }}>
        This shows your true cost after 30 years. <strong>Lower net cost = better financial choice!</strong>
      </p>
    </div>
  );
}