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
import { SuggestionChips } from './SuggestionChips';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chartToShow?: 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth';
  // Store chart data with the message so it doesn't change when new scenarios are calculated
  snapshotData?: {
    chartData: MonthlySnapshot[];
    monthlyCosts: {
      buying: any;
      renting: any;
    };
    totalCostData: {
      buyerFinalNetWorth: number;
      renterFinalNetWorth: number;
      totalBuyingCosts: number;
      totalRentingCosts: number;
      finalHomeValue: number;
      finalInvestmentValue: number;
    };
    // Store the input values that created this chart
    inputValues: {
      homePrice: number;
      monthlyRent: number;
      downPaymentPercent: number;
    };
  };
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Restart modal state
  const [showRestartModal, setShowRestartModal] = useState(false);
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
  
  // Handle save chat as PDF
  const handleSaveChat = async () => {
    try {
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        // Remove emojis that cause random symbols
        const cleanText = text.replace(/[📊🏠💵💰]/g, '').trim();
        
        const lines = pdf.splitTextToSize(cleanText, pageWidth - 2 * margin);
        checkNewPage(lines.length * fontSize * 0.35 + 3);
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.35 + 3;
      };
      
      // Add header
      addText('RentVsBuy.ai Analysis', 20, true);
      addText(`Generated on ${new Date().toLocaleDateString()}`, 12);
      
      // Add scenario info
      const scenario = userData.homePrice && userData.monthlyRent && userData.downPaymentPercent ? 
        `$${userData.homePrice.toLocaleString()}, $${userData.monthlyRent.toLocaleString()}, ${userData.downPaymentPercent}%` : 
        'Incomplete scenario';
      addText(`Scenario: ${scenario}`, 14, true);
      
      yPosition += 5; // Extra space before conversation
      
      // Process each message
      for (const message of messages) {
        const role = message.role === 'user' ? 'You' : 'AI Assistant';
        
        // Add message header
        addText(`${role}:`, 12, true);
        
        // Add message content
        addText(message.content, 11);
        
        // Add chart if present
        if (message.chartToShow && message.snapshotData) {
          const chartNames = {
            netWorth: 'Net Worth Comparison',
            monthlyCost: 'Monthly Costs Breakdown', 
            totalCost: 'Total Cost Comparison',
            equity: 'Equity Buildup',
            rentGrowth: 'Rent Growth Comparison'
          };
          
          const chartName = chartNames[message.chartToShow] || message.chartToShow;
          const inputVals = message.snapshotData.inputValues;
          
          addText(`Chart: ${chartName}`, 12, true);
          
          if (inputVals) {
            addText(`Home Price: $${inputVals.homePrice.toLocaleString()} | Monthly Rent: $${inputVals.monthlyRent.toLocaleString()} | Down Payment: ${inputVals.downPaymentPercent}%`, 10);
          }
          
          // Try to capture and add chart image
          const chartElement = document.querySelector(`[data-message-id="${message.id}"] .chart-wrapper`);
          if (chartElement) {
            try {
              const canvas = await html2canvas(chartElement as HTMLElement, {
                backgroundColor: '#ffffff',
                scale: 2 // Higher quality
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgWidth = pageWidth - 2 * margin;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Check if we need a new page for the chart
              checkNewPage(imgHeight + 5);
              
              pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 5;
              
            } catch (error) {
              console.log('Could not capture chart image:', error);
              addText('[Chart image could not be captured]', 10);
            }
          }
        }
        
        yPosition += 2; // Space between messages
      }
      
      // Save the PDF
      const fileName = `rentvsbuy-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Handle restart/reset
  const handleRestart = () => {
    // Reset all state to initial values
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your rent vs buy advisor. Tell me about your situation - what's the price of the house you're looking at?"
      }
    ]);
    setUserData({
      homePrice: null,
      monthlyRent: null,
      downPaymentPercent: null
    });
    setChartData(null);
    setVisibleCharts({
      netWorth: false,
      monthlyCost: false,
      totalCost: false,
      equity: false,
      rentGrowth: false
    });
    setChartsReady(false);
    setMonthlyCosts(null);
    setTotalCostData(null);
    setShowRestartModal(false);
  };

  // Simple function to check if AI response indicates a chart should be shown
function shouldShowChart(aiResponse: string): string | null {
  const lower = aiResponse.toLowerCase();
  
  // Only trigger on exact phrases that clearly indicate showing a chart
  if (lower.includes("here's your net worth comparison")) return 'netWorth';
  if (lower.includes("here's your monthly costs breakdown")) return 'monthlyCost';
  if (lower.includes("here's your total cost comparison")) return 'totalCost';
  if (lower.includes("here's your equity buildup")) return 'equity';
  if (lower.includes("here's your rent growth")) return 'rentGrowth';
  
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
    setIsLoading(true);
    
    // Extract data from message
    const newUserData = extractUserData(content, userData);
    console.log('🔍 Extracted data:', newUserData);
    setUserData(newUserData);
    
    // Get AI response first
    const allMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const botResponse = await getAIResponse(allMessages, newUserData);

    // Check if AI response indicates a chart should be shown
    const chartToShow = shouldShowChart(botResponse);
    
    let assistantMessage: Message;
    if (chartToShow && chartsReady && chartData && monthlyCosts && totalCostData) {
      // AI wants to show a chart and we have the data
      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponse,
        chartToShow: chartToShow as 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth',
        snapshotData: {
          chartData: chartData,
          monthlyCosts: monthlyCosts,
          totalCostData: totalCostData,
          inputValues: {
            homePrice: newUserData.homePrice!,
            monthlyRent: newUserData.monthlyRent!,
            downPaymentPercent: newUserData.downPaymentPercent!
          }
        }
      };
      
      // Mark this chart as visible
      setVisibleCharts(prev => ({
        ...prev,
        [chartToShow]: true
      }));
    } else {
      // Normal AI response without chart
      assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: botResponse
    };
    }
    
    // Add bot response
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
    
    // If we have all data, calculate charts (regenerate if data changed)
    if (newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent) {
      // Check if data changed
      const dataChanged = 
        newUserData.homePrice !== userData.homePrice ||
        newUserData.monthlyRent !== userData.monthlyRent ||
        newUserData.downPaymentPercent !== userData.downPaymentPercent;
      
      if (!chartsReady || dataChanged) {
        console.log('📊 Generating charts...', newUserData, chartsReady ? '(data changed)' : '(initial)');
        
        // If data changed, reset visible charts (all become available again)
        if (dataChanged && chartsReady) {
          console.log('🔄 Data changed! Resetting chart visibility...');
          setVisibleCharts({
            netWorth: false,
            monthlyCost: false,
            totalCost: false,
            equity: false,
            rentGrowth: false
          });
        }
        
        // Important: Calculate charts with the NEW data
      calculateAndShowChart(newUserData);
        
        // Log to verify correct values are being used
        console.log('✅ Charts will be calculated with:', {
          homePrice: newUserData.homePrice,
          monthlyRent: newUserData.monthlyRent,
          downPaymentPercent: newUserData.downPaymentPercent
        });
        
      }
    }
  };
  
  // Handle suggestion chip clicks

// Handle suggestion chip clicks
const handleChipClick = (message: string) => {
  // Handle chip click as a normal message - let AI handle everything
  handleSendMessage(message);
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
    console.log('✅ Charts generated and ready!');
    
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
  
  // Helper function to render chart based on type - uses message's snapshot data
  const renderChart = (chartType: string, snapshotData?: Message['snapshotData']) => {
    // Use snapshot data from the message, or fall back to current data
    const data = snapshotData?.chartData || chartData;
    const costs = snapshotData?.monthlyCosts || monthlyCosts;
    const totalData = snapshotData?.totalCostData || totalCostData;
    const inputVals = snapshotData?.inputValues || (userData.homePrice && userData.monthlyRent && userData.downPaymentPercent ? {
      homePrice: userData.homePrice,
      monthlyRent: userData.monthlyRent,
      downPaymentPercent: userData.downPaymentPercent
    } : null);
    
    if (!data) return null;
    
    // Values display box
    const ValuesBox = inputVals ? (
      <div style={{
        background: '#f7fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px',
        fontSize: '13px',
        color: '#4a5568'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '6px' }}>📊 Values for this chart:</div>
        <div>🏠 Home Price: <strong>${inputVals.homePrice.toLocaleString()}</strong></div>
        <div>💵 Monthly Rent: <strong>${inputVals.monthlyRent.toLocaleString()}</strong></div>
        <div>💰 Down Payment: <strong>{inputVals.downPaymentPercent}%</strong></div>
      </div>
    ) : null;
    
    switch (chartType) {
      case 'netWorth':
        return (
          <div className="chart-wrapper">
            {ValuesBox}
            <NetWorthChart data={data} />
          </div>
        );
      case 'monthlyCost':
        return costs ? (
          <div className="chart-wrapper">
            {ValuesBox}
            <MonthlyCostChart 
              buyingCosts={costs.buying}
              rentingCosts={costs.renting}
            />
          </div>
        ) : null;
      case 'totalCost':
        return totalData ? (
          <div className="chart-wrapper">
            {ValuesBox}
            <TotalCostChart 
              buyerFinalNetWorth={totalData.buyerFinalNetWorth}
              renterFinalNetWorth={totalData.renterFinalNetWorth}
              totalBuyingCosts={totalData.totalBuyingCosts}
              totalRentingCosts={totalData.totalRentingCosts}
              finalHomeValue={totalData.finalHomeValue}
              finalInvestmentValue={totalData.finalInvestmentValue}
            />
          </div>
        ) : null;
      case 'equity':
        return (
          <div className="chart-wrapper">
            {ValuesBox}
            <EquityBuildupChart data={data} />
          </div>
        );
      case 'rentGrowth':
        return costs ? (
          <div className="chart-wrapper">
            {ValuesBox}
            <RentGrowthChart 
              data={data} 
              monthlyMortgage={costs.buying.mortgage}
            />
          </div>
        ) : null;
      default:
        return null;
    }
  };
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>RentVsBuy.ai</h1>
        <div className="header-buttons">
          <button 
            className="save-button"
            onClick={handleSaveChat}
            title="Save current chat"
          >
            💾 Save Chat
          </button>
          <button 
            className="restart-button"
            onClick={() => setShowRestartModal(true)}
            title="Start over"
          >
            🔄 Restart
          </button>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} data-message-id={message.id}>
          <ChatMessage
            role={message.role}
            content={message.content}
          />
            {/* Render chart right after message if it has one - uses message's snapshot data */}
            {message.chartToShow && renderChart(message.chartToShow, message.snapshotData)}
          </div>
        ))}
        
        {isLoading && (
          <div className="loading-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
        
        {/* ADD CHIPS AT THE END */}
        {chartsReady && (
          <SuggestionChips 
            onChipClick={handleChipClick}
            visibleCharts={visibleCharts}
          />
        )}
      </div>
      
      <ChatInput onSend={handleSendMessage} />
      
      {/* Restart Confirmation Modal */}
      {showRestartModal && (
        <div className="modal-overlay" onClick={() => setShowRestartModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Start Over?</h2>
            <p>This will clear all your data and conversation. Are you sure?</p>
            <div className="modal-buttons">
              <button 
                className="modal-button cancel-button"
                onClick={() => setShowRestartModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-button confirm-button"
                onClick={handleRestart}
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  

}







// Extract numbers from user messages

// Extract numbers from user messages - handles comma-separated values!
function extractUserData(message: string, currentData: UserData): UserData {
  const newData = { ...currentData };
  const lowerMessage = message.toLowerCase();
  
  // Extract ALL numbers from the message (handles various formats)
  const extractAllNumbers = (str: string): number[] => {
    const numbers: number[] = [];
    
    // Pattern 1: $500k or 500k (with k/K suffix)
    const kPattern = /\$?\s*([\d,]+)k\b/gi;
    let match;
    while ((match = kPattern.exec(str)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, '')) * 1000;
      numbers.push(num);
    }
    
    // Pattern 2: Regular numbers with or without $ and commas: $500,000 or 500000 or $500,000
    const numPattern = /\$?\s*([\d,]+(?:\.\d+)?)/g;
    const tempStr = str.replace(/\$?\s*([\d,]+)k\b/gi, ''); // Remove already matched k numbers
    
    while ((match = numPattern.exec(tempStr)) !== null) {
      const cleaned = match[1].replace(/,/g, '');
      // Only parse if it has actual digits and not just commas
      if (cleaned && !isNaN(parseFloat(cleaned))) {
        const num = parseFloat(cleaned);
        // Avoid tiny numbers that are likely not what we want
        if (num >= 0.1) {
          numbers.push(num);
        }
      }
    }
    
    return numbers;
  };
  
  const allNumbers = extractAllNumbers(message);
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
