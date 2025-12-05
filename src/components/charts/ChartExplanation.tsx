import React from 'react';
import './ChartExplanation.css';

interface ChartExplanationProps {
  title: string;
  description: string;
  icon?: string;
}

export const ChartExplanation: React.FC<ChartExplanationProps> = ({
  title,
  description,
  icon = '📊',
}) => (
  <div className="chart-explanation">
    <div className="chart-explanation-header">
      <span className="chart-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <p>{description}</p>
  </div>
);

export const CHART_METADATA: Record<string, { title: string; description: string; icon: string }> = {
  netWorth: {
    title: 'How much money will I have?',
    description:
      'This shows your total net worth (all your money and assets) over time. The blue line is if you buy, the green line is if you rent. Higher = more money.',
    icon: '💰',
  },
  monthlyCost: {
    title: 'What will I pay each month?',
    description:
      "This breaks down your monthly costs. Buying includes mortgage, property tax, insurance, and maintenance. Renting includes rent and renter's insurance.",
    icon: '📅',
  },
  breakEven: {
    title: 'When does buying become worth it?',
    description:
      'This shows the month when buying catches up to renting financially. If the break-even point is after your timeline, renting is better.',
    icon: '⏰',
  },
  totalCost: {
    title: 'Total cost comparison',
    description:
      "This compares everything you'll spend over your timeline. It includes the final value of your home or investments.",
    icon: '💵',
  },
  equity: {
    title: 'How much house will I own?',
    description:
      'This shows your equity - the part of the home you actually own versus what you still owe on the mortgage.',
    icon: '🏠',
  },
  monteCarlo: {
    title: 'What if the market changes?',
    description:
      'This shows 1,000 possible outcomes for home prices based on market volatility. The shaded area shows the range of likely scenarios.',
    icon: '🎲',
  },
  sensitivity: {
    title: 'How sensitive is this to rate changes?',
    description:
      'This shows how your net worth changes if appreciation rates or mortgage rates are different than expected.',
    icon: '📊',
  },
  taxSavings: {
    title: 'Tax deduction benefits',
    description: 'This shows how much you save on taxes from mortgage interest deductions when you buy.',
    icon: '📋',
  },
  cashFlow: {
    title: 'Monthly cash flow difference',
    description:
      'This shows the difference in monthly costs. Positive means renting costs more (buying saves money), negative means buying costs more.',
    icon: '💸',
  },
  cumulativeCost: {
    title: 'Cumulative cost difference',
    description: 'This shows the running total of how much more or less you\'re spending over time.',
    icon: '📊',
  },
  liquidity: {
    title: 'Available cash over time',
    description: "This shows how much liquid cash you'll have available at different points in your timeline.",
    icon: '💧',
  },
  rentGrowth: {
    title: 'Rent growth vs fixed mortgage',
    description: 'This shows how rent increases over time while your mortgage payment stays fixed.',
    icon: '📈',
  },
  breakEvenHeatmap: {
    title: 'Break-even heatmap',
    description: 'This shows when buying becomes better for different combinations of down payment and timeline.',
    icon: '🟩',
  },
  scenarioOverlay: {
    title: 'Scenario comparison',
    description: 'This overlays multiple scenarios so you can compare different options side-by-side.',
    icon: '📊',
  },
};
 