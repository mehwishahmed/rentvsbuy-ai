// src/components/chat/ChatContainer.tsx

import { useState, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { NetWorthChart } from '../charts/NetWorthChart';
import { calculateNetWorthComparison, calculateBuyingCosts, calculateRentingCosts } from '../../lib/finance/calculator';
import { getLocationData, formatLocationData, detectZipCode, type FormattedLocationData } from '../../lib/location/zipCodeService';
import type { ScenarioInputs, MonthlySnapshot } from '../../types/calculator';
import { MonthlyCostChart } from '../charts/MonthlyCostChart';
import { TotalCostChart } from '../charts/TotalCostChart';
import { getAIResponse } from '../../lib/ai/openai';
import { EquityBuildupChart } from '../charts/EquityBuildupChart';
import { RentGrowthChart } from '../charts/RentGrowthChart';
import { BreakEvenChart } from '../charts/BreakEvenChart';
import { getZIPBasedRates } from '../../lib/finance/calculator';
import { SuggestionChips } from './SuggestionChips';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chartToShow?: 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth' | 'breakEven';
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
  timeHorizonYears: number | null;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
        content: "Welcome! I'm your AI-powered financial advisor, here to help you make the smartest decision between buying and renting. I'll analyze your specific situation and show you exactly how your money will grow over time."
      },
      {
        id: '2',
        role: 'assistant',
        content: "Let's get started! What's the home price you're considering and your current monthly rent?\n\nPro tip: You can also enter a ZIP code (like 90210) and I'll pull real local market data for that area!"
    }
  ]);
  
  const [userData, setUserData] = useState<UserData>({
    homePrice: null,
    monthlyRent: null,
    downPaymentPercent: null,
    timeHorizonYears: null
  });
  
  const [chartData, setChartData] = useState<MonthlySnapshot[] | null>(null);
  // Track which charts are visible
  const [visibleCharts, setVisibleCharts] = useState({
  netWorth: false,
  monthlyCost: false,
  totalCost: false,
  equity: false,
  rentGrowth: false,
  breakEven: false
});

// Track if charts are ready to show (data calculated)
const [chartsReady, setChartsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number | null>(null); // Track PDF save progress
  
  // Restart modal state
  const [showRestartModal, setShowRestartModal] = useState(false);
  
  // Location data state
  const [locationData, setLocationData] = useState<FormattedLocationData | null>(null);
  const [showLocationCard, setShowLocationCard] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(false); // Track if user made a choice
  const [usingZipData, setUsingZipData] = useState(false); // Track which scenario
  
  // Ref for scrolling to charts
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
      setSaveProgress(0); // Start progress
      
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
        
        // Remove emojis that cause random symbols in PDF
        const cleanText = text.replace(/[📊🏠💵💰🔄💾]/g, '').trim();
        
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
      const totalMessages = messages.length;
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const role = message.role === 'user' ? 'You' : 'AI Assistant';
        
        // Update progress (10% for setup, 80% for messages, 10% for finalization)
        setSaveProgress(10 + Math.floor((i / totalMessages) * 80));
        
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
            rentGrowth: 'Rent Growth Comparison',
            breakEven: 'Break-Even Timeline'
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
              addText('[Chart image could not be captured]', 10);
            }
          }
        }
        
        yPosition += 2; // Space between messages
      }
      
      // Save the PDF
      setSaveProgress(95);
      const fileName = `rentvsbuy-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setSaveProgress(100);
      
      // Hide progress after a short delay
      setTimeout(() => {
        setSaveProgress(null);
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      setSaveProgress(null); // Hide progress on error
    }
  };

  // Handle restart/reset
  const handleRestart = () => {
    // Reset all state to initial values
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you figure out whether buying or renting makes more financial sense for you. To get started, tell me: what's the home price you're considering and your current monthly rent?"
      }
    ]);
    setUserData({
      homePrice: null,
      monthlyRent: null,
      downPaymentPercent: null,
      timeHorizonYears: null
    });
    setChartData(null);
    setVisibleCharts({
      netWorth: false,
      monthlyCost: false,
      totalCost: false,
      equity: false,
      rentGrowth: false,
      breakEven: false
    });
    setChartsReady(false);
    setMonthlyCosts(null);
    setTotalCostData(null);
    setShowRestartModal(false);
    setLocationData(null);
    setShowLocationCard(false);
    setIsLocationLocked(false);
    setUsingZipData(false);
  };

  const handleUseLocalData = () => {
    if (locationData) {
      // Add confirmation message first (don't set data yet)
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Great! I found local market data for ${locationData.city}, ${locationData.state}:\n\n🏠 **Home Price:** $${locationData.medianHomePrice.toLocaleString()}\n💵 **Monthly Rent:** $${locationData.averageRent.toLocaleString()}\n🏛️ **Property Tax:** ${(locationData.propertyTaxRate * 100).toFixed(2)}%\n📈 **Rent Growth:** ${(locationData.rentGrowthRate * 100).toFixed(1)}%/year\n🏘️ **Home Appreciation:** ${(locationData.homeAppreciationRate * 100).toFixed(1)}%/year\n\nDo you want to use these values? If yes, I'll just need your down payment percentage and timeline!`
      };
      setMessages(prev => [...prev, confirmationMessage]);
      
      // Hide the location card so user can respond via chat
      setShowLocationCard(false);
    }
  };

  const handleKeepMyData = () => {
    if (locationData) {
      // Lock the card in reference mode and show it immediately with blanks
      setIsLocationLocked(true);
      setUsingZipData(false);
      setShowLocationCard(false); // Hide the decision card
      
      // Clear location data so reference box uses custom values, not ZIP data
      setLocationData(null);
      
      // Add AI message referencing the box
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Got it! For reference, the default assumptions are shown in the box on the top right. Now, what home price and monthly rent are you working with?`
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  // Simple function to check if AI response indicates a chart should be shown
function shouldShowChart(aiResponse: string): string | null {
  const lower = aiResponse.toLowerCase();
  
  // Check for chart trigger phrases (allows for "updated", "new", etc.)
  // Match patterns like: "here's your [updated/new] net worth comparison"
  if (lower.match(/here'?s your (updated |new )?net worth comparison/)) return 'netWorth';
  if (lower.match(/here'?s your (updated |new )?monthly costs breakdown/)) return 'monthlyCost';
  if (lower.match(/here'?s your (updated |new )?total cost comparison/)) return 'totalCost';
  if (lower.match(/here'?s your (updated |new )?equity buildup/)) return 'equity';
  // More flexible pattern for Rent Growth (with or without "chart", "comparison", etc.)
  if (lower.match(/here'?s your (updated |new )?rent growth( chart| comparison)?/)) return 'rentGrowth';
  if (lower.match(/here'?s your (updated |new )?break.?even timeline/)) return 'breakEven';
  
  return null;
}

  const handleSendMessage = async (content: string) => {
    // PATH 15: Check if user is confirming ZIP code data usage
    if (locationData && !isLocationLocked) {
      const lowerContent = content.toLowerCase();
      
      // Check if user is confirming they want to use the ZIP data
      if (lowerContent.includes('yes') || lowerContent.includes('yeah') || lowerContent.includes('sure') || 
          lowerContent.includes('use these') || lowerContent.includes('use those') || 
          lowerContent.includes('use the data') || lowerContent.includes('confirm')) {
        
        // Set the ZIP data and lock it
        const newUserData: UserData = {
          homePrice: locationData.medianHomePrice,
          monthlyRent: locationData.averageRent,
          downPaymentPercent: null,
          timeHorizonYears: null
        };
        
        setUserData(newUserData);
        setIsLocationLocked(true);
        setUsingZipData(true);
        
        // Add AI message asking for down payment and timeline
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I'll use the ${locationData.city}, ${locationData.state} market data. Now I just need two more details:\n\n1. What down payment percentage are you thinking? (e.g., 10%, 20%)\n2. How long do you plan to stay in this home? (e.g., 3, 5, 10 years)`
        };
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }, aiMessage]);
        return;
      }
      
      // Check if user wants to decline the ZIP data
      if (lowerContent.includes('no') || lowerContent.includes('nope') || lowerContent.includes('keep my') || 
          lowerContent.includes('use my own') || lowerContent.includes('custom')) {
        
        // Clear location data and continue with custom input
        setLocationData(null);
        setShowLocationCard(false);
        
        const declineMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "No problem! Let's use your own numbers instead. What home price and monthly rent are you working with?"
        };
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }, declineMessage]);
        return;
      }
    }
    
    // PATH 14: Check if user is changing their mind after making a choice
    if (isLocationLocked && locationData) {
      const lowerContent = content.toLowerCase();
      
      // User chose ZIP data but now wants custom
      if (usingZipData && ((lowerContent.includes('actually') || lowerContent.includes('wait')) && (lowerContent.includes('my own') || lowerContent.includes('custom') || lowerContent.includes('enter')))) {
        // Reset to custom mode
        setIsLocationLocked(false);
        setUsingZipData(false);
        setLocationData(null);
        setUserData({ homePrice: null, monthlyRent: null, downPaymentPercent: null, timeHorizonYears: null });
        
        const changeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "No problem! Let's go with your own numbers instead. What home price and monthly rent are you working with?"
        };
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }, changeMessage]);
        return;
      }
      
      // User chose custom but now wants ZIP data
      if (!usingZipData && ((lowerContent.includes('actually') || lowerContent.includes('wait')) && (lowerContent.includes('zip') || lowerContent.includes('local') || lowerContent.includes('those values')))) {
        // Switch to ZIP mode
        setUsingZipData(true);
        setUserData({
          homePrice: locationData.medianHomePrice,
          monthlyRent: locationData.averageRent,
          downPaymentPercent: null,
          timeHorizonYears: null
        });
        
        const changeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sure thing! I'll use the ${locationData.city}, ${locationData.state} data. Just need your down payment percentage.`
        };
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content }, changeMessage]);
        return;
      }
    }
    
    // Check if user is responding to ZIP code choice via text
    if (showLocationCard && locationData && !isLocationLocked) {
      const lowerContent = content.toLowerCase();
      
      // Detect "use local data" intent
      if ((lowerContent.includes('use') && (lowerContent.includes('those') || lowerContent.includes('local') || lowerContent.includes('zip') || lowerContent.includes('that') || lowerContent.includes('data'))) ||
          lowerContent.includes('use those') ||
          lowerContent.includes('use local') ||
          lowerContent.includes('use that data') ||
          lowerContent.includes('use the data') ||
          lowerContent === 'yes' || lowerContent === 'yeah' || lowerContent === 'sure') {
        // Add user message first
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Then trigger the action
        handleUseLocalData();
        return;
      }
      
      // Detect "keep my numbers" intent
      if ((lowerContent.includes('my') && (lowerContent.includes('own') || lowerContent.includes('numbers'))) ||
          lowerContent.includes('enter my') ||
          lowerContent.includes('keep my') ||
          lowerContent.includes('custom') ||
          (lowerContent.includes('no') && (lowerContent.includes('enter') || lowerContent.includes('own'))) ||
          lowerContent === 'no') {
        // Add user message first
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Then trigger the action
        handleKeepMyData();
        return;
      }
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Extract data from message
    const { userData: newUserData, locationData: detectedLocationData } = extractUserData(content, userData);
    
    // Check if user mentioned a ZIP code but it wasn't found
    const zipCode = detectZipCode(content);
    if (zipCode && !detectedLocationData) {
      // Invalid/not found ZIP code
      const invalidZipMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I couldn't find data for ZIP code ${zipCode}. If you'd like, we can continue with your own numbers using standard assumptions (1.0% property tax, 3.5% rent growth). What home price and monthly rent are you working with?`
      };
      setMessages(prev => [...prev, invalidZipMessage]);
      setIsLoading(false);
      return;
    }
    
    // Handle location data if detected
    if (detectedLocationData) {
      setLocationData(detectedLocationData);
      
      // Check if user also provided custom values in the same message
      const hasCustomValues = newUserData.homePrice || newUserData.monthlyRent || newUserData.downPaymentPercent;
      
      if (hasCustomValues) {
        // PATH 10: ZIP + custom data conflict
        // Show card with custom message explaining both options
        setShowLocationCard(true);
        const conflictMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I see you mentioned ${detectedLocationData.city}, ${detectedLocationData.state} (${zipCode}). Here's the current data for that area. Would you like to use these values instead, or should we continue with the numbers you provided${newUserData.homePrice ? ` ($${(newUserData.homePrice / 1000).toFixed(0)}k` : ''}${newUserData.monthlyRent ? `, $${(newUserData.monthlyRent / 1000).toFixed(1)}k` : ''}${newUserData.downPaymentPercent ? `, ${newUserData.downPaymentPercent}%` : ''})?`
        };
        setMessages(prev => [...prev, conflictMessage]);
        setIsLoading(false);
        return; // Wait for user choice
      }
      
      // Normal ZIP flow (no custom data provided)
      setShowLocationCard(true);
      // Reset lock if user is trying a new ZIP code
      if (isLocationLocked) {
        setIsLocationLocked(false);
        setUsingZipData(false);
      }
    }
    setUserData(newUserData);
    
    // Check if we have all data and if it changed
    const hasAllData = newUserData.homePrice && newUserData.monthlyRent && newUserData.downPaymentPercent && newUserData.timeHorizonYears;
    const dataChanged = 
      newUserData.homePrice !== userData.homePrice ||
      newUserData.monthlyRent !== userData.monthlyRent ||
      newUserData.downPaymentPercent !== userData.downPaymentPercent ||
      newUserData.timeHorizonYears !== userData.timeHorizonYears;
    
    // If data changed, we need to recalculate charts BEFORE showing them
    let freshChartData = chartData;
    let freshMonthlyCosts = monthlyCosts;
    let freshTotalCostData = totalCostData;
    
    if (hasAllData && dataChanged) {
      // Calculate fresh data synchronously
      const inputs = {
        homePrice: newUserData.homePrice!,
        downPaymentPercent: newUserData.downPaymentPercent!,
        interestRate: 7.0,
        loanTermYears: 30,
        timeHorizonYears: newUserData.timeHorizonYears!,
        propertyTaxRate: 1.0,
        homeInsuranceAnnual: 1200,
        hoaMonthly: 150,
        maintenanceRate: 1.0,
        homeAppreciationRate: getZIPBasedRates(locationData, newUserData.timeHorizonYears!).homeAppreciationRate,
        monthlyRent: newUserData.monthlyRent!,
        rentGrowthRate: getZIPBasedRates(locationData, newUserData.timeHorizonYears!).rentGrowthRate,
        renterInsuranceAnnual: 240,
        investmentReturnRate: getZIPBasedRates(locationData, newUserData.timeHorizonYears!).investmentReturnRate
      } as ScenarioInputs;
      
      // Calculate net worth comparison
      const snapshots = calculateNetWorthComparison(inputs);
      freshChartData = snapshots;
      
      // Calculate monthly costs
      const buying = calculateBuyingCosts(inputs);
      const renting = calculateRentingCosts(inputs, 1);
      freshMonthlyCosts = {
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
      };
      
      // Calculate total costs over user's timeline
      const finalMonth = snapshots[snapshots.length - 1]; // Last month of user's timeline
      const totalBuyingCosts = snapshots.reduce((sum, s) => sum + s.monthlyBuyingCosts, 0);
      const totalRentingCosts = snapshots.reduce((sum, s) => sum + s.monthlyRentingCosts, 0);
      
      freshTotalCostData = {
        buyerFinalNetWorth: finalMonth.buyerNetWorth,
        renterFinalNetWorth: finalMonth.renterNetWorth,
        totalBuyingCosts,
        totalRentingCosts,
        finalHomeValue: finalMonth.homeValue,
        finalInvestmentValue: finalMonth.investedDownPayment
      };
      
      // Update state
      setChartData(freshChartData);
      setMonthlyCosts(freshMonthlyCosts);
      setTotalCostData(freshTotalCostData);
      setChartsReady(true);
      
      // Reset visible charts (all become available again)
      setVisibleCharts({
        netWorth: false,
        monthlyCost: false,
        totalCost: false,
        equity: false,
        rentGrowth: false,
        breakEven: false
      });
  }

    // Get AI response
    const allMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const botResponse = await getAIResponse(allMessages, newUserData);

    // Check if AI response indicates a chart should be shown
    const chartToShow = shouldShowChart(botResponse);
    
    let assistantMessage: Message;
    if (chartToShow && (chartsReady || hasAllData) && freshChartData && freshMonthlyCosts && freshTotalCostData) {
      // AI wants to show a chart and we have the data
      assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
        content: botResponse,
        chartToShow: chartToShow as 'netWorth' | 'monthlyCost' | 'totalCost' | 'equity' | 'rentGrowth' | 'breakEven',
        snapshotData: {
          chartData: freshChartData,
          monthlyCosts: freshMonthlyCosts,
          totalCostData: freshTotalCostData,
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
      
      // Smooth scroll to the new chart after a brief delay
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 300);
      
    } else {
      // Normal AI response without chart
      assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: botResponse
    };
    }
    
    // If we just got all data for the first time, add confirmation card FIRST
    if (hasAllData && !chartsReady) {
      const confirmationCard: Message = {
        id: (Date.now() + 2).toString(),
        role: 'system', // Special type for UI cards
        content: JSON.stringify({
          type: 'confirmation',
          homePrice: newUserData.homePrice!,
          monthlyRent: newUserData.monthlyRent!,
          downPaymentPercent: newUserData.downPaymentPercent!,
          timeHorizonYears: newUserData.timeHorizonYears!
        })
      };
      setMessages(prev => [...prev, confirmationCard]);
      
      // Show reference box if user never used ZIP code (normal flow without location data)
      if (!isLocationLocked && !locationData) {
        setIsLocationLocked(true);
        setUsingZipData(false);
      }
    }
    
    // Then add bot response (so it appears AFTER the card)
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
    
    // If we have all data and haven't calculated yet (initial case, not data change)
    if (hasAllData && !chartsReady && !dataChanged) {
      console.log('🔍 Calling calculateAndShowChart with locationData:', locationData);
      calculateAndShowChart(newUserData, locationData);
    }
    
    // Force recalculation if we have location data and charts are ready
    if (hasAllData && chartsReady && locationData) {
      console.log('🔍 Force recalculating with location data:', locationData);
      calculateAndShowChart(newUserData, locationData);
    }
  };

// Handle suggestion chip clicks
const handleChipClick = (message: string) => {
    // Handle chip click as a normal message - let AI handle everything
    handleSendMessage(message);
    
};

  const calculateAndShowChart = (data: UserData, currentLocationData?: FormattedLocationData | null) => {
    // Use local property tax rate if available, otherwise default to 1.0%
    // ZIP data stores propertyTaxRate as decimal (0.73 = 0.73%), so convert to percentage
    const propertyTaxRate = (currentLocationData || locationData)?.propertyTaxRate ? (currentLocationData || locationData).propertyTaxRate * 100 : 1.0;
    
    // Debug logging for property tax rate
    console.log('🔍 Property Tax Rate Debug:');
    console.log('Location Data:', currentLocationData || locationData);
    console.log('Property Tax Rate (raw):', (currentLocationData || locationData)?.propertyTaxRate);
    console.log('Property Tax Rate (converted):', propertyTaxRate);
    
    const inputs: ScenarioInputs = {
      homePrice: data.homePrice!,
      downPaymentPercent: data.downPaymentPercent!,
      monthlyRent: data.monthlyRent!,
      interestRate: 7.0,
      loanTermYears: 30,
      timeHorizonYears: data.timeHorizonYears!,
      propertyTaxRate: propertyTaxRate,
      homeInsuranceAnnual: 1200,
      hoaMonthly: 150,
      maintenanceRate: 1.0,
      renterInsuranceAnnual: 240,
      homeAppreciationRate: getZIPBasedRates(locationData, data.timeHorizonYears!).homeAppreciationRate,
      rentGrowthRate: getZIPBasedRates(locationData, data.timeHorizonYears!).rentGrowthRate,
      investmentReturnRate: getZIPBasedRates(locationData, data.timeHorizonYears!).investmentReturnRate
    };
    
    // Calculate net worth comparison
    const snapshots = calculateNetWorthComparison(inputs);

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
    
    // Calculate total costs over user's timeline
    const finalMonth = snapshots[snapshots.length - 1]; // Last month of user's timeline
    const totalBuyingCosts = snapshots.reduce((sum, s) => sum + s.monthlyBuyingCosts, 0);
    const totalRentingCosts = snapshots.reduce((sum, s) => sum + s.monthlyRentingCosts, 0);

    setTotalCostData({
      buyerFinalNetWorth: finalMonth.buyerNetWorth,
      renterFinalNetWorth: finalMonth.renterNetWorth,
      totalBuyingCosts,
      totalRentingCosts,
      finalHomeValue: finalMonth.homeValue,
      finalInvestmentValue: finalMonth.investedDownPayment
    });
  };
  
  // Helper function to render chart based on type - uses message's snapshot data
  const renderChart = (chartType: string, snapshotData?: Message['snapshotData']) => {
    // Use snapshot data from the message, or fall back to current data
    const data = snapshotData?.chartData || chartData;
    // For monthly cost chart, always use fresh data if available (to get updated ZIP-based rates)
    const costs = chartType === 'monthlyCost' ? monthlyCosts : (snapshotData?.monthlyCosts || monthlyCosts);
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
              timelineYears={Math.ceil((chartData?.length || 0) / 12)}
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
      case 'breakEven':
        return (
          <div className="chart-wrapper">
            {ValuesBox}
            <BreakEvenChart data={data} />
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="app-layout">
      
      {/* Location Data Card */}
      {showLocationCard && locationData && !isLocationLocked && (
        // Decision Mode: Show big card with buttons
        <div className="location-data-card">
          <div className="location-card-header">
            <h3>📍 {locationData.city}, {locationData.state}</h3>
            <button 
              className="location-card-close"
              onClick={() => setShowLocationCard(false)}
              title="Close"
            >
              ×
            </button>
          </div>
          <div className="location-card-content">
            <div className="location-section-title">Local Market Data:</div>
            <div className="location-data-item">
              <span className="location-icon">🏠</span>
              <span className="location-label">Median home price:</span>
              <span className="location-value">${locationData.medianHomePrice.toLocaleString()}</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">💵</span>
              <span className="location-label">Average rent:</span>
              <span className="location-value">${locationData.averageRent.toLocaleString()}/mo</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">🏛️</span>
              <span className="location-label">Property tax rate:</span>
              <span className="location-value">{locationData.propertyTaxRate}%</span>
            </div>
            
            <div className="location-section-title" style={{ marginTop: '12px' }}>National Averages:</div>
            <div className="location-data-item">
              <span className="location-icon">📈</span>
              <span className="location-label">Rent growth:</span>
              <span className="location-value">3.5%/year</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">🏘️</span>
              <span className="location-label">Home appreciation:</span>
              <span className="location-value">3.0%/year</span>
            </div>
            <div className="location-data-item">
              <span className="location-icon">💹</span>
              <span className="location-label">Investment return:</span>
              <span className="location-value">7.0%/year</span>
            </div>
          </div>
          <div className="location-card-actions">
            <button 
              className="location-btn location-btn-primary"
              onClick={handleUseLocalData}
            >
              Use this data
            </button>
            <button 
              className="location-btn location-btn-secondary"
              onClick={handleKeepMyData}
            >
              Keep my numbers
            </button>
          </div>
        </div>
      )}
      
      {/* Reference Box: Show after user makes choice */}
      {isLocationLocked && (
        <div className="reference-box">
          <div className="reference-box-header">
            <h4>📊 Your Inputs</h4>
          </div>
          <div className="reference-box-content">
            {usingZipData && locationData ? (
              // Scenario 1: Using ZIP data
              <>
                <div className="reference-item">
                  <span className="ref-label">🏠 Home:</span>
                  <span className="ref-value">
                    {userData.homePrice ? `$${userData.homePrice.toLocaleString()}` : '___'} 
                    <small>({locationData.city})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💵 Rent:</span>
                  <span className="ref-value">
                    {userData.monthlyRent ? `$${userData.monthlyRent.toLocaleString()}/mo` : '___'} 
                    <small>({locationData.city})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💰 Down:</span>
                  <span className="ref-value">
                    {userData.downPaymentPercent ? `${userData.downPaymentPercent}%` : '___'} 
                    <small>(you chose)</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">⏰ Timeline:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${userData.timeHorizonYears} years` : '___'} 
                    <small>(you chose)</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏛️ Tax:</span>
                  <span className="ref-value">{(locationData.propertyTaxRate * 100).toFixed(2)}% <small>({locationData.state})</small></span>
                </div>
                <div className="reference-divider"></div>
                <div className="reference-item">
                  <span className="ref-label">📈 Rent growth:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).rentGrowthRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'nat\'l avg'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏘️ Appreciation:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).homeAppreciationRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'based on timeline'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💹 Investment:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).investmentReturnRate}%/year` : '___'} 
                    <small>(based on timeline)</small>
                  </span>
                </div>
              </>
            ) : (
              // Scenario 2: Using custom data
              <>
                <div className="reference-item">
                  <span className="ref-label">🏠 Home:</span>
                  <span className="ref-value">
                    {userData.homePrice ? `$${userData.homePrice.toLocaleString()}` : '___'} 
                    <small>(you chose)</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💵 Rent:</span>
                  <span className="ref-value">
                    {userData.monthlyRent ? `$${userData.monthlyRent.toLocaleString()}/mo` : '___'} 
                    <small>(you chose)</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💰 Down:</span>
                  <span className="ref-value">
                    {userData.downPaymentPercent ? `${userData.downPaymentPercent}%` : '___'} 
                    <small>(you chose)</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">⏰ Timeline:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${userData.timeHorizonYears} years` : '___'} 
                    <small>(you chose)</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏛️ Tax:</span>
                  <span className="ref-value">1.0% <small>(nat'l avg)</small></span>
                </div>
                <div className="reference-divider"></div>
                <div className="reference-item">
                  <span className="ref-label">📈 Rent growth:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).rentGrowthRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'nat\'l avg'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">🏘️ Appreciation:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).homeAppreciationRate.toFixed(1)}%/year` : '___'} 
                    <small>({locationData ? `${locationData.city} market` : 'based on timeline'})</small>
                  </span>
                </div>
                <div className="reference-item">
                  <span className="ref-label">💹 Investment:</span>
                  <span className="ref-value">
                    {userData.timeHorizonYears ? `${getZIPBasedRates(locationData, userData.timeHorizonYears).investmentReturnRate}%/year` : '___'} 
                    <small>(based on timeline)</small>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
    <div className="chat-container">
      <div className="chat-header">
        <h1 className="app-title">RentVsBuy.ai</h1>
          <div className="header-buttons">
            <button 
              className="save-button"
              onClick={handleSaveChat}
              title="Save current chat"
            >
              Save Chat
            </button>
            <button 
              className="restart-button"
              onClick={() => setShowRestartModal(true)}
              title="Start over"
            >
Restart
            </button>
          </div>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} data-message-id={message.id}>
            {/* Render confirmation card for system messages */}
            {message.role === 'system' ? (
              (() => {
                try {
                  const data = JSON.parse(message.content);
                  if (data.type === 'confirmation') {
                    const downPaymentAmount = (data.homePrice * data.downPaymentPercent) / 100;
                    return (
                      <div className="confirmation-card">
                        <div className="confirmation-header">✓ Your Scenario</div>
                        <div className="confirmation-details">
                          <div className="confirmation-item">
                            <span className="confirmation-icon">🏠</span>
                            <span className="confirmation-label">Home:</span>
                            <span className="confirmation-value">${data.homePrice.toLocaleString()}</span>
                          </div>
                          <div className="confirmation-item">
                            <span className="confirmation-icon">💵</span>
                            <span className="confirmation-label">Rent:</span>
                            <span className="confirmation-value">${data.monthlyRent.toLocaleString()}/mo</span>
                          </div>
                          <div className="confirmation-item">
                            <span className="confirmation-icon">💰</span>
                            <span className="confirmation-label">Down:</span>
                            <span className="confirmation-value">{data.downPaymentPercent}% (${downPaymentAmount.toLocaleString()})</span>
                          </div>
                          <div className="confirmation-item">
                            <span className="confirmation-icon">⏰</span>
                            <span className="confirmation-label">Timeline:</span>
                            <span className="confirmation-value">{data.timeHorizonYears} years</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  return null;
                }
              })()
            ) : (
          <ChatMessage
            role={message.role}
            content={message.content}
          />
            )}
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

        {/* Scroll target for smooth scrolling to charts */}
        <div ref={messagesEndRef} />
              </div>
      
      {/* Chart Navigation Buttons - above input for convenience */}
      {chartsReady && (
        <div className="chart-nav-bar">
          <span className="chart-nav-label">📊 Charts:</span>
          <div className="chart-nav-buttons-horizontal">
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me monthly costs')}
              title="View Monthly Costs"
            >
              💰 Monthly
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me net worth')}
              title="View Net Worth"
            >
              📈 Net Worth
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me total cost')}
              title="View Total Cost"
            >
              💵 Total Cost
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me equity buildup')}
              title="View Equity Buildup"
            >
              🏠 Equity
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me rent growth')}
              title="View Rent Growth"
            >
              📊 Rent
            </button>
            <button 
              className="chart-nav-btn-sm"
              onClick={() => handleChipClick('show me break even')}
              title="View Break-Even Timeline"
            >
              ⏰ Break-Even
            </button>
          </div>
              </div>
            )}
  
      <ChatInput onSend={handleSendMessage} />
      
        {/* Footer */}
        <div className="chat-footer">
          <span>RentVsBuy.ai v1.0</span>
          <span>•</span>
          <span>Built with AI-powered insights</span>
              </div>
      </div>
      
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
  
      {/* Save Progress Modal */}
      {saveProgress !== null && (
        <div className="modal-overlay">
          <div className="progress-modal">
            <div className="progress-circle">
              <svg className="progress-ring" width="120" height="120">
                <circle
                  className="progress-ring-circle-bg"
                  stroke="#e0e0e0"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                />
                <circle
                  className="progress-ring-circle"
                  stroke="#4CAF50"
                  strokeWidth="8"
                  fill="transparent"
                  r="52"
                  cx="60"
                  cy="60"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - saveProgress / 100)}`,
                    transition: 'stroke-dashoffset 0.3s ease'
                  }}
                />
              </svg>
              <div className="progress-text">{saveProgress}%</div>
              </div>
            <p className="progress-label">Generating PDF...</p>
      </div>
              </div>
            )}
      
    </div>
  );
  

}







// Extract numbers from user messages

// Extract numbers from user messages - handles comma-separated values!
function extractUserData(message: string, currentData: UserData): { userData: UserData; locationData: FormattedLocationData | null } {
  const newData = { ...currentData };
  const lowerMessage = message.toLowerCase();
  
  // Check for ZIP code FIRST and remove it from the message for number extraction
  const zipCode = detectZipCode(message);
  let locationData: FormattedLocationData | null = null;
  let messageWithoutZip = message;
  
  if (zipCode) {
    const rawLocationData = getLocationData(zipCode);
    if (rawLocationData) {
      locationData = formatLocationData(rawLocationData);
    }
    // Remove the ZIP code from message so it doesn't get extracted as a home price
    messageWithoutZip = message.replace(new RegExp(`\\b${zipCode}\\b`, 'g'), '');
  }
  
  // Check if user is providing NEW values (overwrite mode)
  const isNewData = lowerMessage.includes('new') || 
                    lowerMessage.includes('try') || 
                    lowerMessage.includes('different') ||
                    lowerMessage.includes('change') ||
                    lowerMessage.includes('instead') ||
                    lowerMessage.includes('now');
  
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
  
  const allNumbers = extractAllNumbers(messageWithoutZip);
  
  
  // If only one number, use context clues
  if (allNumbers.length === 1) {
    const num = allNumbers[0];
    
    // Home price (big number or has keywords)
    if ((isNewData || !newData.homePrice) && (num > 50000 || lowerMessage.includes('house') || lowerMessage.includes('home') || lowerMessage.includes('price'))) {
      newData.homePrice = num;
    }
    // Rent (medium number or has keywords)
    else if ((isNewData || !newData.monthlyRent) && (num >= 500 && num <= 50000 || lowerMessage.includes('rent'))) {
      newData.monthlyRent = num;
    }
    // Down payment (small number or has keywords)
    else if ((isNewData || !newData.downPaymentPercent) && (num >= 1 && num <= 100 || lowerMessage.includes('%') || lowerMessage.includes('down'))) {
      newData.downPaymentPercent = num;
    }
    // Time horizon (years, 1-30 range or has keywords) - Check if message contains both down payment and timeline
    else if ((isNewData || !newData.timeHorizonYears) && (num >= 1 && num <= 30 || lowerMessage.includes('year') || lowerMessage.includes('stay') || lowerMessage.includes('plan'))) {
      // If message contains both % and year keywords, or if down payment is already set, assign timeline
      if (lowerMessage.includes('%') && (lowerMessage.includes('year') || lowerMessage.includes('years') || lowerMessage.includes('yr')) || newData.downPaymentPercent) {
        newData.timeHorizonYears = num;
      }
    }
  }
  
  // If multiple numbers, assign by size
  else if (allNumbers.length >= 2) {
    allNumbers.sort((a, b) => b - a); // Sort largest to smallest
    
    // Special case: If we have 2 small numbers (1-100) and message contains both % and years
    if (allNumbers.length === 2 && allNumbers.every(n => n >= 1 && n <= 100) && 
        lowerMessage.includes('%') && (lowerMessage.includes('year') || lowerMessage.includes('years') || lowerMessage.includes('yr'))) {
      
      // Both numbers are small, assign based on context
      // If message has both % and years, assign both values
      newData.downPaymentPercent = allNumbers[0];
      newData.timeHorizonYears = allNumbers[1];
      
      return { userData: newData, locationData };
    }
    
    // Detect if all 3 values are present - if so, it's a complete new scenario
    const hasLargeNumber = allNumbers.some(n => n > 50000);
    const hasMediumNumber = allNumbers.some(n => n >= 500 && n <= 50000);
    const hasSmallNumber = allNumbers.some(n => n >= 1 && n <= 100);
    const isCompleteScenario = hasLargeNumber && hasMediumNumber && hasSmallNumber;
    
    // If we have all 3 types of numbers in one message, treat as new scenario (overwrite)
    const shouldOverwrite = isNewData || isCompleteScenario;
    
    // Biggest number = home price
    if ((shouldOverwrite || !newData.homePrice) && allNumbers[0] > 50000) {
      newData.homePrice = allNumbers[0];
    }
    
    // Medium number = rent
    const rentNumber = allNumbers.find(n => n >= 500 && n <= 50000);
    if ((shouldOverwrite || !newData.monthlyRent) && rentNumber) {
      newData.monthlyRent = rentNumber;
    }
    
    // Small number = down payment % (1-100)
    const downNumber = allNumbers.find(n => n >= 1 && n <= 100 && n !== rentNumber);
    if ((shouldOverwrite || !newData.downPaymentPercent) && downNumber) {
      newData.downPaymentPercent = downNumber;
    }
    
    // Time horizon (1-30 years)
    const timeNumber = allNumbers.find(n => n >= 1 && n <= 30 && n !== downNumber && n !== rentNumber);
    if ((shouldOverwrite || !newData.timeHorizonYears) && timeNumber) {
      newData.timeHorizonYears = timeNumber;
    }
  }
  
  
  return { userData: newData, locationData };
}
