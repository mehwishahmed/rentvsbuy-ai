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
    breakEven: boolean;
  };
}

interface Suggestion {
  id: string;
  text: string;
  message: string;
  type: 'chart' | 'general';
}

export function SuggestionChips({ onChipClick, visibleCharts }: SuggestionChipsProps) {
  // All possible suggestions - only general questions now (charts have dedicated buttons)
  const allSuggestions: Suggestion[] = [
    {
      id: 'advice',
      text: '💡 Should I buy in my situation?',
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
      id: 'rentIncrease',
      text: '🔄 What if rent increases faster?',
      message: 'What if rent increases faster than expected?',
      type: 'general'
    },
    {
      id: 'maintenance',
      text: '🔧 What about maintenance costs?',
      message: 'What about ongoing maintenance costs?',
      type: 'general'
    },
    {
      id: 'flexibility',
      text: '🚚 How does flexibility factor in?',
      message: 'How important is flexibility in this decision?',
      type: 'general'
    },
    {
      id: 'investment',
      text: '📈 Could I invest the down payment instead?',
      message: 'What if I invested the down payment instead of buying?',
      type: 'general'
    }
  ];

  // All suggestions are available (no chart filtering needed)
  const availableSuggestions = allSuggestions;

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
  }, [visibleCharts.netWorth, visibleCharts.monthlyCost, visibleCharts.totalCost, visibleCharts.equity, visibleCharts.rentGrowth, visibleCharts.breakEven]);

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