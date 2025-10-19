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
function extractUserData(message: string, currentData: UserData): UserData {
  const newData = { ...currentData };
  
  // Look for house price: "$500k", "$500,000", "500000"
  if (!message.toLowerCase().includes('rent') && !message.toLowerCase().includes('%')) {
    const priceMatch = message.match(/\$?([\d,]+)k?\b/i);
    if (priceMatch) {
      let price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (message.toLowerCase().includes('k')) {
        price *= 1000;
      }
      if (price > 50000) {
        newData.homePrice = price;
      }
    }
  }
  
  // Look for rent: "$2,800", "2800", "paying $3,500 per month", etc
  if (message.toLowerCase().includes('rent') || message.toLowerCase().includes('paying')) {
    const rentMatch = message.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (rentMatch) {
      const rentValue = parseFloat(rentMatch[1].replace(/,/g, ''));
      if (rentValue >= 500 && rentValue <= 50000) {
        newData.monthlyRent = rentValue;
      }
    }
  }
  
  // Look for down payment: "20%", "20 percent", "30%"
  const downMatch = message.match(/(\d+)\s*%|(\d+)\s*percent/i);
  if (downMatch) {
    const downPayment = parseFloat(downMatch[1] || downMatch[2]);
    if (downPayment >= 1 && downPayment <= 100) {
      newData.downPaymentPercent = downPayment;
    }
  }
  
  return newData;
}