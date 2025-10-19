// src/lib/finance/calculator.ts

import type { ScenarioInputs, MonthlySnapshot, CalculatorOutput } from '../../types/calculator';

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
    month: number // Which month (1-360) we're calculating for
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
// FUNCTION #5: Calculate Net Worth Comparison (Full 360 months)
// ===================================
export function calculateNetWorthComparison(inputs: ScenarioInputs): MonthlySnapshot[] {
    const snapshots: MonthlySnapshot[] = [];
    
    const downPaymentAmount = inputs.homePrice * (inputs.downPaymentPercent / 100);
    const loanAmount = inputs.homePrice - downPaymentAmount;
    const amortization = generateAmortizationSchedule(
      loanAmount,
      inputs.interestRate,
      inputs.loanTermYears
    );
    
    const buyingCosts = calculateBuyingCosts(inputs);
    
    // Track invested down payment for renter
    let investedDownPayment = downPaymentAmount;
    const monthlyInvestmentReturn = inputs.investmentReturnRate / 100 / 12;
    
    // Loop through all 360 months
    for (let month = 1; month <= 360; month++) {
      const amortMonth = amortization[month - 1];
      
      // === BUYING SCENARIO ===
      const yearsElapsed = (month - 1) / 12;
      const homeValue = inputs.homePrice * Math.pow(1 + inputs.homeAppreciationRate / 100, yearsElapsed);
      const homeEquity = homeValue - amortMonth.remainingBalance;
      const buyerNetWorth = homeEquity;
      
      // === RENTING SCENARIO ===
      const rentingCosts = calculateRentingCosts(inputs, month);
      
      // Invested down payment grows each month (compound interest)
      investedDownPayment = investedDownPayment * (1 + monthlyInvestmentReturn);
      
      // Renter's net worth = invested down payment
      const renterNetWorth = investedDownPayment;
      
      // === COMPARISON ===
      const netWorthDelta = buyerNetWorth - renterNetWorth;
      
      snapshots.push({
        month,
        mortgagePayment: amortMonth.payment,
        principalPaid: amortMonth.principalPaid,
        interestPaid: amortMonth.interestPaid,
        remainingBalance: amortMonth.remainingBalance,
        homeValue,
        homeEquity,
        monthlyBuyingCosts: buyingCosts.total,
        monthlyRent: rentingCosts.monthlyRent,
        monthlyRentingCosts: rentingCosts.total,
        investedDownPayment,
        buyerNetWorth,
        renterNetWorth,
        netWorthDelta
      });
    }
    
    return snapshots;
  }