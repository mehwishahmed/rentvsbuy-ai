// src/components/chat/ChatContainer.tsx

import { useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { NetWorthChart } from '../charts/NetWorthChart';
import { calculateNetWorthComparison, calculateBuyingCosts, calculateRentingCosts } from '../../lib/finance/calculator';
import type { ScenarioInputs, MonthlySnapshot } from '../../types/calculator';
import { MonthlyCostChart } from '../charts/MonthlyCostChart';
import { TotalCostChart } from '../charts/TotalCostChart';
import { getAIResponse } from '../../lib/ai/openai';
import { EquityBuildupChart } from '../charts/EquityBuildupChart';
import { RentGrowthChart } from '../charts/RentGrowthChart';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UserData {
  homePrice: number | null;
  monthlyRent: number | null;
  downPaymentPercent: number | null;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your rent vs buy advisor. Tell me about your situation - what's the price of the house you're looking at?"
    }
  ]);
  
  const [userData, setUserData] = useState<UserData>({
    homePrice: null,
    monthlyRent: null,
    downPaymentPercent: null
  });
  
  const [chartData, setChartData] = useState<MonthlySnapshot[] | null>(null);
  const [monthlyCosts, setMonthlyCosts] = useState<{
    buying: any;
    renting: any;
  } | null>(null);
  
  const [totalCostData, setTotalCostData] = useState<{
    buyerFinalNetWorth: number;
    renterFinalNetWorth: number;
    totalBuyingCosts: number;
    totalRentingCosts: number;
    finalHomeValue: number;
    finalInvestmentValue: number;
  } | null>(null);
  
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Extract data from message
    const newUserData = extractUserData(content, userData);
    console.log('🔍 Extracted data:', newUserData);
    setUserData(newUserData);
    
    // Get AI response
    const allMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const botResponse = await getAIResponse(allMessages, newUserData);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: botResponse
    };
    
    // Add bot response
    setMessages(prev => [...prev, assistantMessage]);
    
    // If we have all data, calculate and show charts
    if (newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent) {
      calculateAndShowChart(newUserData);
    }
  };
  
  const calculateAndShowChart = (data: UserData) => {
    const inputs: ScenarioInputs = {
      homePrice: data.homePrice!,
      downPaymentPercent: data.downPaymentPercent!,
      monthlyRent: data.monthlyRent!,
      interestRate: 7.0,
      loanTermYears: 30,
      propertyTaxRate: 1.0,
      homeInsuranceAnnual: 1200,
      hoaMonthly: 150,
      maintenanceRate: 1.0,
      renterInsuranceAnnual: 240,
      homeAppreciationRate: 3.0,
      rentGrowthRate: 3.5,
      investmentReturnRate: 7.0
    };
    
    // Calculate net worth comparison
    const snapshots = calculateNetWorthComparison(inputs);
    
    // DEBUG: Check a few snapshots
    console.log('=== SNAPSHOT DEBUG ===');
    console.log('Month 1:', snapshots[0]);
    console.log('Month 60 (Year 5):', snapshots[59]);
    console.log('Month 180 (Year 15):', snapshots[179]);
    console.log('Month 360 (Year 30):', snapshots[359]);

    setChartData(snapshots);
    
    // Calculate monthly costs
    const buying = calculateBuyingCosts(inputs);
    const renting = calculateRentingCosts(inputs, 1);
    setMonthlyCosts({
      buying: {
        mortgage: buying.mortgage,
        propertyTax: buying.propertyTax,
        insurance: buying.insurance,
        hoa: buying.hoa,
        maintenance: buying.maintenance,
        total: buying.total
      },
      renting: {
        rent: renting.monthlyRent,
        insurance: renting.insurance,
        total: renting.total
      }
    });
    
    // Calculate total costs over 30 years
    const month360 = snapshots[359]; // Last month (year 30)
    const totalBuyingCosts = snapshots.reduce((sum, s) => sum + s.monthlyBuyingCosts, 0);
    const totalRentingCosts = snapshots.reduce((sum, s) => sum + s.monthlyRentingCosts, 0);

    setTotalCostData({
      buyerFinalNetWorth: month360.buyerNetWorth,
      renterFinalNetWorth: month360.renterNetWorth,
      totalBuyingCosts,
      totalRentingCosts,
      finalHomeValue: month360.homeValue,
      finalInvestmentValue: month360.investedDownPayment
    });
  };
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>RentVsBuy.ai</h1>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}
        
        {/* Show chart when we have data */}
        {chartData && (
          <div className="chart-wrapper">
            <NetWorthChart data={chartData} />
          </div>
        )}

        {chartData && (
        <div className="chart-wrapper">
            <EquityBuildupChart data={chartData} />
        </div>
        )}

        {/* Chart 5: Rent Growth */}
        {chartData && monthlyCosts && (
        <div className="chart-wrapper">
            <RentGrowthChart 
            data={chartData} 
            monthlyMortgage={monthlyCosts.buying.mortgage}
            />
        </div>
        )}

        {/* Show monthly cost breakdown */}
        {monthlyCosts && (
          <div className="chart-wrapper">
            <MonthlyCostChart 
              buyingCosts={monthlyCosts.buying}
              rentingCosts={monthlyCosts.renting}
            />
          </div>
        )}
        
        {/* Show total cost comparison */}
        {totalCostData && (
          <div className="chart-wrapper">
            <TotalCostChart 
              buyerFinalNetWorth={totalCostData.buyerFinalNetWorth}
              renterFinalNetWorth={totalCostData.renterFinalNetWorth}
              totalBuyingCosts={totalCostData.totalBuyingCosts}
              totalRentingCosts={totalCostData.totalRentingCosts}
              finalHomeValue={totalCostData.finalHomeValue}
              finalInvestmentValue={totalCostData.finalInvestmentValue}
            />
          </div>
        )}
        
      </div>
      
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}

// Extract numbers from user messages

// Extract numbers from user messages with better context awareness
// Extract numbers from user messages - handles multiple values at once!
function extractUserData(message: string, currentData: UserData): UserData {
  const newData = { ...currentData };
  const lowerMessage = message.toLowerCase();
  
  // Helper: Extract all numbers from message
  const extractAllNumbers = (str: string): number[] => {
    const numbers: number[] = [];
    const regex = /\$?\s*([\d,]+)k?\b/gi;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      let num = parseFloat(match[1].replace(/,/g, ''));
      // Check if 'k' appears within 2 characters after the number
      const afterMatch = str.slice(match.index, match.index + match[0].length + 2);
      if (afterMatch.toLowerCase().includes('k')) {
        num *= 1000;
      }
      numbers.push(num);
    }
    return numbers;
  };
  
  const allNumbers = extractAllNumbers(message);
  
  // RULE 1: Extract home price (look for keywords or big numbers)
  if (!newData.homePrice) {
    if (lowerMessage.includes('house') || lowerMessage.includes('home') || lowerMessage.includes('price')) {
      const price = allNumbers.find(n => n > 50000);
      if (price) {
        newData.homePrice = price;
      }
    } else {
      // Fallback: biggest number over 50k
      const bigNumber = allNumbers.find(n => n > 50000);
      if (bigNumber) {
        newData.homePrice = bigNumber;
      }
    }
  }
  
  // RULE 2: Extract rent (look for keywords or medium numbers)
  if (!newData.monthlyRent) {
    if (lowerMessage.includes('rent') || lowerMessage.includes('paying')) {
      const rent = allNumbers.find(n => n >= 500 && n <= 50000 && n !== newData.homePrice);
      if (rent) {
        newData.monthlyRent = rent;
      }
    } else {
      // Fallback: medium number in rent range
      const rentRange = allNumbers.find(n => n >= 500 && n <= 50000 && n !== newData.homePrice);
      if (rentRange) {
        newData.monthlyRent = rentRange;
      }
    }
  }
  
  // RULE 3: Extract down payment % (look for % or small numbers)
  if (!newData.downPaymentPercent) {
    const percentMatch = message.match(/(\d+)\s*%|(\d+)\s*percent/i);
    if (percentMatch) {
      const down = parseFloat(percentMatch[1] || percentMatch[2]);
      if (down >= 1 && down <= 100) {
        newData.downPaymentPercent = down;
      }
    } else {
      // Fallback: small number (1-100 range)
      const smallNum = allNumbers.find(n => n >= 1 && n <= 100 && n !== newData.homePrice && n !== newData.monthlyRent);
      if (smallNum) {
        newData.downPaymentPercent = smallNum;
      }
    }
  }
  
  return newData;
}
