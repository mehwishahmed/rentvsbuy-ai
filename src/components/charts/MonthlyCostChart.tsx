// src/components/charts/MonthlyCostChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyCostChartProps {
  buyingCosts: {
    mortgage: number;
    propertyTax: number;
    insurance: number;
    hoa: number;
    maintenance: number;
    total: number;
  };
  rentingCosts: {
    rent: number;
    insurance: number;
    total: number;
  };
}

export function MonthlyCostChart({ buyingCosts, rentingCosts }: MonthlyCostChartProps) {
  // Prepare data for the chart
  const data = [
    {
      name: 'Buying',
      total: Math.round(buyingCosts.total),
      color: '#667eea'
    },
    {
      name: 'Renting',
      total: Math.round(rentingCosts.total),
      color: '#f56565'
    }
  ];
  
  // Breakdown data for tooltip
  const buyingBreakdown = [
    { label: 'Mortgage', value: buyingCosts.mortgage },
    { label: 'Property Tax', value: buyingCosts.propertyTax },
    { label: 'Home Insurance', value: buyingCosts.insurance },
    { label: 'HOA', value: buyingCosts.hoa },
    { label: 'Maintenance', value: buyingCosts.maintenance }
  ];
  
  const rentingBreakdown = [
    { label: 'Rent', value: rentingCosts.rent },
    { label: 'Renter\'s Insurance', value: rentingCosts.insurance }
  ];
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Cost Comparison</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
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
          />
          <Legend />
          <Bar dataKey="total" name="Monthly Cost" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Breakdown sections */}
      <div className="cost-breakdown">
        <div className="breakdown-column">
          <h4 style={{ color: '#667eea' }}>Buying Breakdown</h4>
          {buyingBreakdown.map(item => (
            <div key={item.label} className="breakdown-item">
              <span>{item.label}:</span>
              <span>${Math.round(item.value).toLocaleString()}/mo</span>
            </div>
          ))}
          <div className="breakdown-item breakdown-total">
            <span><strong>Total:</strong></span>
            <span><strong>${Math.round(buyingCosts.total).toLocaleString()}/mo</strong></span>
          </div>
        </div>
        
        <div className="breakdown-column">
          <h4 style={{ color: '#f56565' }}>Renting Breakdown</h4>
          {rentingBreakdown.map(item => (
            <div key={item.label} className="breakdown-item">
              <span>{item.label}:</span>
              <span>${Math.round(item.value).toLocaleString()}/mo</span>
            </div>
          ))}
          <div className="breakdown-item breakdown-total">
            <span><strong>Total:</strong></span>
            <span><strong>${Math.round(rentingCosts.total).toLocaleString()}/mo</strong></span>
          </div>
        </div>
      </div>
      
      <p className="chart-description">
        This shows your monthly costs in the first year. Rent will increase over time.
      </p>
    </div>
  );
}