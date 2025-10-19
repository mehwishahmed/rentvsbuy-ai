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

  // Detect which chart user is asking for
function detectChartRequest(message: string): string | null {
  const lower = message.toLowerCase();
  
  // Net worth chart keywords (most specific first)
  if (lower.includes('net worth') || lower.includes('wealth') || lower.includes('richer')) {
    return 'netWorth';
  }
  
  // Monthly cost chart keywords
  if (lower.includes('monthly cost') || lower.includes('monthly breakdown') || lower.includes('afford') || lower.includes('per month')) {
    return 'monthlyCost';
  }
  
  // Total cost chart keywords
  if (lower.includes('total cost') || lower.includes('30 year') || lower.includes('overall cost') || lower.includes('winner') || lower.includes('which wins') || lower.includes('which option')) {
    return 'totalCost';
  }
  
  // Equity chart keywords
  if (lower.includes('equity') || lower.includes('ownership')) {
    return 'equity';
  }
  
  // Rent growth chart keywords
  if (lower.includes('rent grow') || lower.includes('rent increase') || lower.includes('mortgage vs rent')) {
    return 'rentGrowth';
  }
  
  // Generic chart requests - default to net worth comparison
  if ((lower.includes('chart') || lower.includes('graph') || lower.includes('show me') || lower.includes('see a')) && 
      (lower.includes('comparison') || lower.includes('compare'))) {
    return 'netWorth';
  }
  
  return null;
}

// Check if user is asking for a chart (even if it doesn't exist)
function isChartRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return (lower.includes('chart') || lower.includes('graph') || lower.includes('show') || lower.includes('see')) &&
         !lower.includes('suggestion');
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
    
    // Check if user is requesting a chart
    const chartRequest = detectChartRequest(content);
    const isAskingForChart = isChartRequest(content);
    
    // Handle chart requests
    if (isAskingForChart) {
      console.log('🎯 Chart requested! chartsReady:', chartsReady, 'userData:', userData);
      if (!chartsReady) {
        // Charts not ready - ask for data first
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'd love to show you charts! But first, I need some information. Can you tell me: the house price, your monthly rent, and down payment percentage?"
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      } else if (chartRequest) {
        // Chart exists and is available - show it!
        const chartNames: { [key: string]: string } = {
          netWorth: 'net worth comparison',
          monthlyCost: 'monthly costs breakdown',
          totalCost: 'total cost comparison',
          equity: 'equity buildup',
          rentGrowth: 'rent growth comparison'
        };
        
        // If data just changed, wait for calculation to complete
        const dataChanged = 
          newUserData.homePrice !== userData.homePrice ||
          newUserData.monthlyRent !== userData.monthlyRent ||
          newUserData.downPaymentPercent !== userData.downPaymentPercent;
          
        if (dataChanged) {
          console.log('⏳ Data changed, calculating chart data with new values...');
          // Calculate the chart data immediately with the new values
          const inputs: ScenarioInputs = {
            homePrice: newUserData.homePrice!,
            monthlyRent: newUserData.monthlyRent!,
            downPaymentPercent: newUserData.downPaymentPercent!,
            interestRate: 6.5,
            loanTermYears: 30,
            propertyTaxRate: 1.2,
            homeInsuranceAnnual: 1200,
            hoaMonthly: 0,
            maintenanceRate: 1.0,
            renterInsuranceAnnual: 240,
            homeAppreciationRate: 3.0,
            rentGrowthRate: 3.5,
            investmentReturnRate: 7.0
          };
          
          // Calculate net worth comparison with NEW data
          const newSnapshots = calculateNetWorthComparison(inputs);
          
          // Calculate monthly costs with NEW data
          const newBuying = calculateBuyingCosts(inputs);
          const newRenting = calculateRentingCosts(inputs, 1);
          const newMonthlyCosts = {
            buying: {
              mortgage: newBuying.mortgage,
              propertyTax: newBuying.propertyTax,
              insurance: newBuying.insurance,
              hoa: newBuying.hoa,
              maintenance: newBuying.maintenance,
              total: newBuying.total
            },
            renting: {
              rent: newRenting.monthlyRent,
              insurance: newRenting.insurance,
              total: newRenting.total
            }
          };
          
          // Calculate total costs with NEW data
          const month360 = newSnapshots[359];
          const newTotalBuyingCosts = newSnapshots.reduce((sum, s) => sum + s.monthlyBuyingCosts, 0);
          const newTotalRentingCosts = newSnapshots.reduce((sum, s) => sum + s.monthlyRentingCosts, 0);
          const newTotalCostData = {
            buyerFinalNetWorth: month360.buyerNetWorth,
            renterFinalNetWorth: month360.renterNetWorth,
            totalBuyingCosts: newTotalBuyingCosts,
            totalRentingCosts: newTotalRentingCosts,
            finalHomeValue: month360.homeValue,
            finalInvestmentValue: month360.investedDownPayment
          };
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Here's the ${chartNames[chartRequest]}!`,
            chartToShow: chartRequest as 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth',
            snapshotData: {
              chartData: newSnapshots,
              monthlyCosts: newMonthlyCosts,
              totalCostData: newTotalCostData,
              inputValues: {
                homePrice: newUserData.homePrice!,
                monthlyRent: newUserData.monthlyRent!,
                downPaymentPercent: newUserData.downPaymentPercent!
              }
            }
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setVisibleCharts(prev => ({
            ...prev,
            [chartRequest]: true
          }));
        } else {
          // No data change, create message immediately
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Here's the ${chartNames[chartRequest]}!`,
            chartToShow: chartRequest as 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth',
            snapshotData: chartData && monthlyCosts && totalCostData && newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent ? {
              chartData: chartData,
              monthlyCosts: monthlyCosts,
              totalCostData: totalCostData,
              inputValues: {
                homePrice: newUserData.homePrice,
                monthlyRent: newUserData.monthlyRent,
                downPaymentPercent: newUserData.downPaymentPercent
              }
            } : undefined
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setVisibleCharts(prev => ({
            ...prev,
            [chartRequest]: true
          }));
        }
        return;
      } else {
        // User asked for a chart that doesn't exist
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I don't have that specific chart available. Here's what I can show you:\n\n📊 Net Worth Comparison\n💰 Monthly Costs Breakdown\n🏆 Total Cost Comparison\n🏠 Equity Buildup\n📈 Rent Growth\n\nWhich one would you like to see?"
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }
    }

    // Normal conversation - get AI response
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
        
        // If this is a chart request, wait a moment for calculation to complete
        if (isAskingForChart && chartRequest) {
          setTimeout(() => {
            console.log('🔄 Re-checking chart data after calculation...');
            // Force re-render by updating visible charts
            setVisibleCharts(prev => ({
              ...prev,
              [chartRequest]: true
            }));
          }, 100);
        }
      }
    }
  };
  
  // Handle suggestion chip clicks

// Handle suggestion chip clicks
const handleChipClick = (message: string) => {
  // Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: message
  };
  setMessages(prev => [...prev, userMessage]);
  
  // Check if this is a chart request
  const chartRequest = detectChartRequest(message);
  const isAskingForChart = isChartRequest(message);
  
  if (isAskingForChart) {
    if (chartRequest && chartsReady) {
      // Show the requested chart
      setVisibleCharts(prev => ({
        ...prev,
        [chartRequest]: true
      }));
      
      // Add a brief bot response WITH chart attached
      const chartNames: { [key: string]: string } = {
        netWorth: 'net worth comparison',
        monthlyCost: 'monthly costs breakdown',
        totalCost: 'total cost comparison',
        equity: 'equity buildup',
        rentGrowth: 'rent growth comparison'
      };
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Here's the ${chartNames[chartRequest]}!`,
        chartToShow: chartRequest as 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth',
        snapshotData: chartData && monthlyCosts && totalCostData && userData.homePrice && userData.monthlyRent && userData.downPaymentPercent ? {
          chartData: chartData,
          monthlyCosts: monthlyCosts,
          totalCostData: totalCostData,
          inputValues: {
            homePrice: userData.homePrice,
            monthlyRent: userData.monthlyRent,
            downPaymentPercent: userData.downPaymentPercent
          }
        } : undefined
      };
      setMessages(prev => [...prev, botMessage]);
    } else if (!chartsReady) {
      // Charts not ready yet
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I need your information first to generate charts! Can you tell me: the house price, your monthly rent, and down payment percentage?"
      };
      setMessages(prev => [...prev, botMessage]);
    } else {
      // Chart doesn't exist
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I don't have that chart. Here's what's available:\n\n📊 Net Worth Comparison\n💰 Monthly Costs Breakdown\n🏆 Total Cost Comparison\n🏠 Equity Buildup\n📈 Rent Growth"
      };
      setMessages(prev => [...prev, botMessage]);
    }
  } else {
    // General question - provide conversational response
    const downPaymentAmount = ((userData.homePrice || 0) * (userData.downPaymentPercent || 20) / 100);
    const responses: { [key: string]: string } = {
      '10 years': 'If you only stay 10 years, the math changes significantly. Early years favor renting since you are paying mostly interest, and closing costs reduce gains. Check the charts to see the break-even point!',
      'down payment': userData.homePrice && userData.downPaymentPercent 
        ? `You would need $${downPaymentAmount.toLocaleString()} for your ${userData.downPaymentPercent}% down payment. That is a significant upfront cost compared to renting.`
        : 'I need your home price and down payment percentage first to calculate that!',
      'prices drop': 'If home prices drop, you could end up underwater (owing more than the home is worth). However, if you plan to stay long-term and can afford payments, temporary drops may not matter. Real estate historically appreciates over 20-30 years.',
      'tax benefits': 'Homeowners can deduct mortgage interest and property taxes (up to limits). This reduces your taxable income. However, with the higher standard deduction now, many people do not itemize anymore, reducing this benefit.',
      'should i buy': `Based on your numbers, ${userData.homePrice && userData.monthlyRent ? 'buying could save you significant money over 30 years' : 'I need your numbers first'}. But consider: Can you afford the down payment? Planning to stay 5+ years? Comfortable with maintenance responsibilities?`,
      'pay off': 'Buying typically pays off after 5-7 years once you build equity and avoid rent increases. However, this depends on your local market, interest rates, and how long you stay. The charts above show your specific timeline!',
      'rent increases': 'If rent increases faster than the typical 3.5% we are assuming, buying becomes even more attractive! Your mortgage stays fixed while rent keeps climbing. Want me to show you the rent growth chart?'
    };
    
    // Find matching response
    const lowerMessage = message.toLowerCase();
    let response = "That's a great question! ";
    
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }
    
    // Default if no match
    if (response === "That's a great question! ") {
      response += "I'm here to help you understand the rent vs buy decision. Feel free to ask about costs, charts, or any specific scenarios!";
    }
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response
    };
    setMessages(prev => [...prev, botMessage]);
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
