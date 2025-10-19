// src/components/chat/SuggestionChips.tsx

import { useState, useEffect } from 'react';
import './SuggestionChips.css';

interface SuggestionChipsProps {
  onChipClick: (message: string) => void;
  visibleCharts: {
    netWorth: boolean;
    monthlyCost: boolean;
    totalCost: boolean;
    equity: boolean;
    rentGrowth: boolean;
  };
}

interface Suggestion {
  id: string;
  text: string;
  message: string;
  type: 'chart' | 'general';
}

export function SuggestionChips({ onChipClick, visibleCharts }: SuggestionChipsProps) {
  // All possible suggestions
  const allSuggestions: Suggestion[] = [
    // Chart suggestions
    {
      id: 'netWorth',
      text: '📊 Show net worth comparison',
      message: 'Show me the net worth comparison',
      type: 'chart'
    },
    {
      id: 'monthlyCost',
      text: '💰 Monthly costs breakdown',
      message: 'What are the monthly costs?',
      type: 'chart'
    },
    {
      id: 'totalCost',
      text: '🏆 Which option wins?',
      message: 'Show me the total cost comparison',
      type: 'chart'
    },
    {
      id: 'equity',
      text: '🏠 Home equity buildup',
      message: 'Show me the equity buildup',
      type: 'chart'
    },
    {
      id: 'rentGrowth',
      text: '📈 Rent vs mortgage growth',
      message: 'How does rent grow compared to mortgage?',
      type: 'chart'
    },
    // General questions
    {
      id: 'shortTerm',
      text: '🤔 What if I only stay 10 years?',
      message: 'What if I only stay in the house for 10 years?',
      type: 'general'
    },
    {
      id: 'downPayment',
      text: '💵 How much for down payment?',
      message: 'How much do I need for the down payment?',
      type: 'general'
    },
    {
      id: 'priceDrop',
      text: '📉 What if prices drop?',
      message: 'What if home prices drop after I buy?',
      type: 'general'
    },
    {
      id: 'taxes',
      text: '🏦 What are the tax benefits?',
      message: 'What are the tax benefits of buying?',
      type: 'general'
    },
    {
      id: 'advice',
      text: '📊 Should I buy in my situation?',
      message: 'Should I buy or rent in my situation?',
      type: 'general'
    },
    {
      id: 'breakEven',
      text: '⏰ When does buying pay off?',
      message: 'When does buying become worth it?',
      type: 'general'
    },
    {
      id: 'rentIncrease',
      text: '🔄 What if rent increases faster?',
      message: 'What if rent increases faster than expected?',
      type: 'general'
    }
  ];

  // Filter out chart suggestions that are already visible
  const availableSuggestions = allSuggestions.filter(s => {
    if (s.type === 'general') return true;
    if (s.id === 'netWorth') return !visibleCharts.netWorth;
    if (s.id === 'monthlyCost') return !visibleCharts.monthlyCost;
    if (s.id === 'totalCost') return !visibleCharts.totalCost;
    if (s.id === 'equity') return !visibleCharts.equity;
    if (s.id === 'rentGrowth') return !visibleCharts.rentGrowth;
    return true;
  });

  // State for currently displayed chips (always show 2)
  const [displayedChips, setDisplayedChips] = useState<Suggestion[]>([]);
  const [remainingChips, setRemainingChips] = useState<Suggestion[]>([]);

  // Initialize chips on mount or when available suggestions change
  useEffect(() => {
    // Shuffle available suggestions for variety
    const shuffled = [...availableSuggestions].sort(() => Math.random() - 0.5);
    
    // Show first 2, keep rest in queue
    setDisplayedChips(shuffled.slice(0, 2));
    setRemainingChips(shuffled.slice(2));
  }, [visibleCharts.netWorth, visibleCharts.monthlyCost, visibleCharts.totalCost, visibleCharts.equity, visibleCharts.rentGrowth]);

  const handleChipClick = (chip: Suggestion) => {
    // Send the message
    onChipClick(chip.message);

    // Replace clicked chip with next from queue
    setDisplayedChips(prev => {
      const filtered = prev.filter(c => c.id !== chip.id);
      
      if (remainingChips.length > 0) {
        // Add next chip from queue
        const nextChip = remainingChips[0];
        setRemainingChips(prev => prev.slice(1));
        return [...filtered, nextChip];
      }
      
      // If no more chips in queue, just remove clicked one
      return filtered;
    });
  };

  // Don't render if no chips to display
  if (displayedChips.length === 0) {
    return null;
  }

  return (
    <div className="suggestion-chips">
      <p className="suggestion-label">Try asking:</p>
      <div className="chips-container">
        {displayedChips.map(chip => (
          <button
            key={chip.id}
            className="chip"
            onClick={() => handleChipClick(chip)}
          >
            {chip.text}
          </button>
        ))}
      </div>
      <p className="chips-remaining">
        {remainingChips.length > 0 && `${remainingChips.length} more suggestions available`}
      </p>
    </div>
  );
}