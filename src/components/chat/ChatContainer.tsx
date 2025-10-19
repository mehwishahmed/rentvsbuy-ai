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
  // Track which charts are visible
  const [visibleCharts, setVisibleCharts] = useState({
  netWorth: false,
  monthlyCost: false,
  totalCost: false,
  equity: false,
  rentGrowth: false
});

// Track if charts are ready to show (data calculated)
const [chartsReady, setChartsReady] = useState(false);
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
  
  // Detect which chart user is asking for
function detectChartRequest(message: string): string | null {
  const lower = message.toLowerCase();
  
  // Net worth chart keywords
  if (lower.includes('net worth') || lower.includes('wealth') || lower.includes('richer') || lower.includes('comparison')) {
    return 'netWorth';
  }
  
  // Monthly cost chart keywords
  if (lower.includes('monthly') || lower.includes('afford') || lower.includes('cost breakdown') || lower.includes('per month')) {
    return 'monthlyCost';
  }
  
  // Total cost chart keywords
  if (lower.includes('total cost') || lower.includes('30 year') || lower.includes('overall') || lower.includes('winner')) {
    return 'totalCost';
  }
  
  // Equity chart keywords
  if (lower.includes('equity') || lower.includes('own') || lower.includes('ownership')) {
    return 'equity';
  }
  
  // Rent growth chart keywords
  if (lower.includes('rent grow') || lower.includes('rent increase') || lower.includes('mortgage vs rent')) {
    return 'rentGrowth';
  }
  
  return null;
}

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
    
    // check if user is requesting a chart
  if (chartsReady) {
    const chartRequest = detectChartRequest(content);
    if (chartRequest) {
      setVisibleCharts(prev => ({
        ...prev,
        [chartRequest]: true
      }));
    }
  }

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
    setChartsReady(true); // Mark charts as ready (but don't show yet!)
    
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
        
        {chartData && chartsReady && (
          <>
            {visibleCharts.netWorth && (
              <div className="chart-wrapper">
                <NetWorthChart data={chartData} />
              </div>
            )}
  
            {visibleCharts.monthlyCost && monthlyCosts && (
              <div className="chart-wrapper">
                <MonthlyCostChart 
                  buyingCosts={monthlyCosts.buying}
                  rentingCosts={monthlyCosts.renting}
                />
              </div>
            )}
  
            {visibleCharts.totalCost && totalCostData && (
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
  
            {visibleCharts.equity && (
              <div className="chart-wrapper">
                <EquityBuildupChart data={chartData} />
              </div>
            )}
  
            {visibleCharts.rentGrowth && monthlyCosts && (
              <div className="chart-wrapper">
                <RentGrowthChart 
                  data={chartData} 
                  monthlyMortgage={monthlyCosts.buying.mortgage}
                />
              </div>
            )}
          </>
        )}
      </div>
      
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
  

}







// Extract numbers from user messages

// Extract numbers from user messages - handles comma-separated values!
function extractUserData(message: string, currentData: UserData): UserData {
  const newData = { ...currentData };
  const lowerMessage = message.toLowerCase();
  
  // Helper: Extract number from a single string (not comma-separated)
  const extractSingleNumber = (str: string): number | null => {
    // Match formats: 500000, $500k, $500,000 (with thousand separators)
    const numMatch = str.match(/\$?\s*([\d,]+)k?\b/i);
    if (numMatch) {
      let num = parseFloat(numMatch[1].replace(/,/g, ''));
      if (str.toLowerCase().includes('k')) {
        num *= 1000;
      }
      return num;
    }
    return null;
  };
  
  // Split by commas and extract all numbers
  const parts = message.split(/,|\s+and\s+/); // Split by comma or "and"
  const allNumbers: number[] = [];
  
  parts.forEach(part => {
    const num = extractSingleNumber(part.trim());
    if (num !== null) {
      allNumbers.push(num);
    }
  });
  
  console.log('🔍 Found numbers:', allNumbers);
  
  // If only one number, use context clues
  if (allNumbers.length === 1) {
    const num = allNumbers[0];
    
    // Home price (big number or has keywords)
    if (!newData.homePrice && (num > 50000 || lowerMessage.includes('house') || lowerMessage.includes('home') || lowerMessage.includes('price'))) {
      newData.homePrice = num;
    }
    // Rent (medium number or has keywords)
    else if (!newData.monthlyRent && (num >= 500 && num <= 50000 || lowerMessage.includes('rent'))) {
      newData.monthlyRent = num;
    }
    // Down payment (small number or has keywords)
    else if (!newData.downPaymentPercent && (num >= 1 && num <= 100 || lowerMessage.includes('%') || lowerMessage.includes('down'))) {
      newData.downPaymentPercent = num;
    }
  }
  
  // If multiple numbers, assign by size
  else if (allNumbers.length >= 2) {
    allNumbers.sort((a, b) => b - a); // Sort largest to smallest
    
    // Biggest number = home price
    if (!newData.homePrice && allNumbers[0] > 50000) {
      newData.homePrice = allNumbers[0];
    }
    
    // Medium number = rent
    const rentNumber = allNumbers.find(n => n >= 500 && n <= 50000);
    if (!newData.monthlyRent && rentNumber) {
      newData.monthlyRent = rentNumber;
    }
    
    // Small number = down payment %
    const downNumber = allNumbers.find(n => n >= 1 && n <= 100 && n !== rentNumber);
    if (!newData.downPaymentPercent && downNumber) {
      newData.downPaymentPercent = downNumber;
    }
  }
  
  return newData;
}
