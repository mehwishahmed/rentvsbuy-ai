// src/lib/finance/calculator.ts

import type { ScenarioInputs, MonthlySnapshot } from '../../types/calculator';

interface LocationRateData {
  homeAppreciationRate?: number | null;
  rentGrowthRate?: number | null;
}

// ===================================
// TIMELINE-BASED ASSUMPTIONS
// ===================================

export function getTimelineBasedRates(timeHorizonYears: number): {
  homeAppreciationRate: number;
  rentGrowthRate: number;
  investmentReturnRate: number;
} {
  if (timeHorizonYears <= 3) {
    // Short timeline: Conservative assumptions
    return {
      homeAppreciationRate: 0.5,  // 0.5% annual (realistic for short-term)
      rentGrowthRate: 2.0,        // 2% annual (conservative)
      investmentReturnRate: 4.0   // 4% annual (conservative)
    };
  } else if (timeHorizonYears <= 7) {
    // Medium timeline: Moderate assumptions
    return {
      homeAppreciationRate: 1.5,  // 1.5% annual (moderate)
      rentGrowthRate: 3.0,        // 3% annual (moderate)
      investmentReturnRate: 6.0   // 6% annual (moderate)
    };
  } else {
    // Long timeline: Optimistic assumptions
    return {
      homeAppreciationRate: 2.5,  // 2.5% annual (optimistic)
      rentGrowthRate: 3.5,        // 3.5% annual (optimistic)
      investmentReturnRate: 7.0   // 7% annual (optimistic)
    };
  }
}

// ZIP + Timeline Hybrid: Use local rates with timeline adjustments
export function getZIPBasedRates(
  locationData: LocationRateData | null,
  timeHorizonYears: number
): { homeAppreciationRate: number; rentGrowthRate: number; investmentReturnRate: number } {
  
  // Get timeline-based investment return (always use timeline for investment)
  const timelineRates = getTimelineBasedRates(timeHorizonYears);
  
  // Check if we have valid ZIP-specific rates (explicitly check for null/undefined, allow 0 and negative)
  const hasHomeAppreciation = locationData?.homeAppreciationRate !== null && locationData?.homeAppreciationRate !== undefined;
  const hasRentGrowth = locationData?.rentGrowthRate !== null && locationData?.rentGrowthRate !== undefined;
  const homeRate = hasHomeAppreciation ? (locationData!.homeAppreciationRate as number) : null;
  const rentRate = hasRentGrowth ? (locationData!.rentGrowthRate as number) : null;
  
  if (hasHomeAppreciation && hasRentGrowth) {
    // Use ZIP-specific rates with timeline adjustments
    const timelineMultiplier = getTimelineMultiplier(timeHorizonYears);
    
    return {
      homeAppreciationRate: (homeRate ?? 0) * timelineMultiplier, // Allow negative rates
      rentGrowthRate: Math.max(0, (rentRate ?? 0) * timelineMultiplier),
      investmentReturnRate: timelineRates.investmentReturnRate
    };
  }
  
  // Partial fallback: use ZIP data for one rate if available, timeline for the other
  if (hasHomeAppreciation) {
    const timelineMultiplier = getTimelineMultiplier(timeHorizonYears);
    return {
      homeAppreciationRate: (homeRate ?? timelineRates.homeAppreciationRate) * timelineMultiplier,
      rentGrowthRate: timelineRates.rentGrowthRate,
      investmentReturnRate: timelineRates.investmentReturnRate
    };
  }
  
  if (hasRentGrowth) {
    const timelineMultiplier = getTimelineMultiplier(timeHorizonYears);
    return {
      homeAppreciationRate: timelineRates.homeAppreciationRate,
      rentGrowthRate: Math.max(0, (rentRate ?? 0) * timelineMultiplier),
      investmentReturnRate: timelineRates.investmentReturnRate
    };
  }
  
  // Full fallback to timeline-based rates
  return {
    homeAppreciationRate: timelineRates.homeAppreciationRate,
    rentGrowthRate: timelineRates.rentGrowthRate,
    investmentReturnRate: timelineRates.investmentReturnRate
  };
}

function getTimelineMultiplier(timeHorizonYears: number): number {
  if (timeHorizonYears <= 3) return 0.1;  // 10% of market rate (conservative for short-term)
  if (timeHorizonYears <= 7) return 0.5;  // 50% of market rate (moderate)
  return 1.0; // 100% of market rate (full market rate for long-term)
}

// ===================================
// FUNCTION #1: Calculate Monthly Mortgage Payment
// ===================================

export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  // Edge case: no loan (100% down payment)
  if (principal <= 0) return 0;
  
  // Edge case: 0% interest
  if (annualInterestRate === 0) {
    return principal / (loanTermYears * 12);
  }
  
  // Convert annual rate to monthly rate (as decimal)
  const monthlyRate = annualInterestRate / 100 / 12;
  
  // Total number of payments
  const numPayments = loanTermYears * 12;
  
  // Calculate using mortgage formula
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
  const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;
  
  const monthlyPayment = principal * (numerator / denominator);
  
  return monthlyPayment;
}

// ===================================
// FUNCTION #2: Generate Full Amortization Schedule
// ===================================

export function generateAmortizationSchedule(
    principal: number,
    annualInterestRate: number,
    loanTermYears: number
  ): Array<{
    month: number;
    payment: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
  }> {
    const schedule = [];
    const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, loanTermYears);
    const monthlyRate = annualInterestRate / 100 / 12;
    const numPayments = loanTermYears * 12;
    
    let remainingBalance = principal;
    
    for (let month = 1; month <= numPayments; month++) {
      // Interest is calculated on remaining balance
      const interestPaid = remainingBalance * monthlyRate;
      
      // Rest goes to principal
      const principalPaid = monthlyPayment - interestPaid;
      
      // Update balance
      remainingBalance = Math.max(0, remainingBalance - principalPaid);
      
      schedule.push({
        month,
        payment: monthlyPayment,
        principalPaid,
        interestPaid,
        remainingBalance
      });
    }
    
    return schedule;
  }

// ===================================
// FUNCTION #3: Calculate Monthly Buying Costs
// ===================================

export function calculateBuyingCosts(inputs: ScenarioInputs): {
    mortgage: number;
    propertyTax: number;
    insurance: number;
    hoa: number;
    maintenance: number;
    total: number;
  } {
    // Calculate loan amount (home price minus down payment)
    const downPaymentAmount = inputs.homePrice * (inputs.downPaymentPercent / 100);
    const loanAmount = inputs.homePrice - downPaymentAmount;
    
    // Monthly mortgage payment
    const mortgage = calculateMonthlyPayment(
      loanAmount,
      inputs.interestRate,
      inputs.loanTermYears
    );
    
    // Property tax (annual rate applied to home value, divided by 12)
    const propertyTax = (inputs.homePrice * (inputs.propertyTaxRate / 100)) / 12;
    
    // Debug logging for property tax calculation
    console.log('🔍 Property Tax Debug:');
    console.log('Home Price:', inputs.homePrice);
    console.log('Property Tax Rate:', inputs.propertyTaxRate);
    console.log('Annual Property Tax:', inputs.homePrice * (inputs.propertyTaxRate / 100));
    console.log('Monthly Property Tax:', propertyTax);
    
    // Insurance (annual cost divided by 12)
    const insurance = inputs.homeInsuranceAnnual / 12;
    
    // HOA (already monthly)
    const hoa = inputs.hoaMonthly;
    
    // Maintenance (annual rate applied to home value, divided by 12)
    const maintenance = (inputs.homePrice * (inputs.maintenanceRate / 100)) / 12;
    
    // Total monthly cost
    const total = mortgage + propertyTax + insurance + hoa + maintenance;
    
    return {
      mortgage,
      propertyTax,
      insurance,
      hoa,
      maintenance,
      total
    };
  }

  // ===================================
// FUNCTION #4: Calculate Renting Costs (with growth over time)
// ===================================

export function calculateRentingCosts(
    inputs: ScenarioInputs,
    month: number // Which month (1 to user's timeline) we're calculating for
  ): {
    monthlyRent: number;
    insurance: number;
    total: number;
  } {
    // Rent grows annually
    // Calculate which year we're in (month 1-12 = year 0, month 13-24 = year 1, etc.)
    const year = Math.floor((month - 1) / 12);
    
    // Apply compound growth: rent * (1 + growth_rate)^year
    const growthMultiplier = Math.pow(1 + inputs.rentGrowthRate / 100, year);
    const monthlyRent = inputs.monthlyRent * growthMultiplier;
    
    // Renter's insurance (annual cost divided by 12)
    const insurance = inputs.renterInsuranceAnnual / 12;
    
    // Total monthly cost
    const total = monthlyRent + insurance;
    
    return {
      monthlyRent,
      insurance,
      total
    };
  }

// ===================================
// FUNCTION #5: Calculate Net Worth Comparison (User's timeline)
// ===================================
export function calculateNetWorthComparison(inputs: ScenarioInputs): MonthlySnapshot[] {
    const snapshots: MonthlySnapshot[] = [];
    
    // Calculate loan amount (home price - down payment)
    const downPaymentAmount = inputs.homePrice * (inputs.downPaymentPercent / 100);
    const loanAmount = inputs.homePrice - downPaymentAmount;
    
    // Generate amortization schedule for the full loan term (30 years)
    const amortization = generateAmortizationSchedule(
      loanAmount,
      inputs.interestRate,
      30  // Always use 30-year loan term, not user's timeline
    );
    
    // Get timeline-based assumptions
    const timelineRates = getTimelineBasedRates(inputs.timeHorizonYears);
    const monthlyInvestmentReturn = timelineRates.investmentReturnRate / 100 / 12;
    const monthlyHomeAppreciation = timelineRates.homeAppreciationRate / 100 / 12;
    const monthlyRentGrowth = inputs.rentGrowthRate / 100 / 12;
    
    // Initialize tracking variables
    let homeValue = inputs.homePrice;
    let remainingBalance = loanAmount;
    let rent = inputs.monthlyRent;
    
    // Upfront costs - use user-provided values or defaults
    const closingCostsPercent = inputs.closingCostsPercent ?? 3.0;
    const closingCostsBuy = inputs.homePrice * (closingCostsPercent / 100);
    const sellingCostsPercent = inputs.sellingCostsPercent ?? 6.0;
    
    // Day 0: Initial positions
    let buyerCashAccount = -downPaymentAmount - closingCostsBuy; // Buyer spent down payment + closing
    let buyerEquity = downPaymentAmount; // Buyer's initial equity
    let renterPortfolio = downPaymentAmount; // Renter keeps/invests the down payment
    
    // Loop through the user's timeline (convert years to months)
    const totalMonths = inputs.timeHorizonYears * 12;
    for (let month = 1; month <= totalMonths; month++) {
      const amortMonth = amortization[month - 1];
      
      // === GROWTH ===
      homeValue *= (1 + monthlyHomeAppreciation);
      rent *= (1 + monthlyRentGrowth);
      
      // === MORTGAGE AMORTIZATION ===
      const interestPaid = remainingBalance * (inputs.interestRate / 100 / 12);
      const principalPaid = amortMonth.payment - interestPaid;
      remainingBalance = Math.max(0, remainingBalance - principalPaid);
      buyerEquity = homeValue - remainingBalance;
      
      // === MONTHLY OWNER COSTS (non-equity) ===
      const propertyTaxMonthly = (inputs.propertyTaxRate / 100 * homeValue) / 12;
      const insuranceMonthly = inputs.homeInsuranceAnnual / 12;
      const maintenanceMonthly = (inputs.maintenanceRate / 100 * homeValue) / 12;
      const hoaMonthly = inputs.hoaMonthly;
      
      // PMI logic (until LTV <= 80%) - use user-provided PMI rate or default
      const hasPMI = (remainingBalance / homeValue) > 0.80;
      const pmiRate = inputs.pmiRate ?? 0.5;
      const pmiMonthly = hasPMI ? (loanAmount * (pmiRate / 100)) / 12 : 0;
      
      const ownerMonthlyCost = 
        interestPaid + 
        propertyTaxMonthly + 
        insuranceMonthly + 
        maintenanceMonthly + 
        hoaMonthly + 
        pmiMonthly;
      
      // === MONTHLY RENTER COSTS ===
      const renterMonthlyCost = rent;
      
      // === CASH FLOW DIFFERENCE INVESTING ===
      // Positive = renting costs more (buyer saves money, can invest the difference)
      // Negative = owning costs more (renter saves money, can invest the difference)
      const cashFlowDiff = renterMonthlyCost - ownerMonthlyCost;
      
      if (cashFlowDiff > 0) {
        // Renting costs more - buyer saves money, invests the difference
        buyerCashAccount = (buyerCashAccount + cashFlowDiff) * (1 + monthlyInvestmentReturn);
        renterPortfolio = renterPortfolio * (1 + monthlyInvestmentReturn);
      } else {
        // Owning costs more - renter saves money, invests the difference
        renterPortfolio = (renterPortfolio + Math.abs(cashFlowDiff)) * (1 + monthlyInvestmentReturn);
        buyerCashAccount = buyerCashAccount * (1 + monthlyInvestmentReturn);
      }
      
      // === NET WORTH CALCULATION ===
      const isFinalMonth = month === totalMonths;
      const sellingCosts = isFinalMonth ? homeValue * (sellingCostsPercent / 100) : 0;
      
      const buyerNetWorth = (buyerEquity - sellingCosts) + buyerCashAccount;
      const renterNetWorth = renterPortfolio;
      const netWorthDelta = buyerNetWorth - renterNetWorth;
      
      // Debug logging for 1-year scenario
      if (inputs.timeHorizonYears === 1 && month === 12) {
        console.log('🔍 1-YEAR DEBUG (Month 12):');
        console.log('Home Value:', homeValue);
        console.log('Buyer Equity:', buyerEquity);
        console.log('Selling Costs:', sellingCosts);
        console.log('Buyer Cash Account:', buyerCashAccount);
        console.log('Buyer Net Worth:', buyerNetWorth);
        console.log('Renter Portfolio:', renterNetWorth);
        console.log('Net Worth Delta:', netWorthDelta);
        console.log('Cash Flow Diff (month 12):', cashFlowDiff);
        console.log('Owner Monthly Cost (month 12):', ownerMonthlyCost);
        console.log('Renter Monthly Cost (month 12):', renterMonthlyCost);
      }
      
      // === STORE SNAPSHOT ===
      snapshots.push({
        month,
        mortgagePayment: amortMonth.payment,
        principalPaid: amortMonth.principalPaid,
        interestPaid: amortMonth.interestPaid,
        remainingBalance: amortMonth.remainingBalance,
        homeValue,
        homeEquity: buyerEquity,
        monthlyBuyingCosts: ownerMonthlyCost,
        monthlyRent: rent,
        monthlyRentingCosts: renterMonthlyCost,
        investedDownPayment: renterPortfolio,
        buyerNetWorth,
        renterNetWorth,
        netWorthDelta
      });
    }
    
    return snapshots;
  }