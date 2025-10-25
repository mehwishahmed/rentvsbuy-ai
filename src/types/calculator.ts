// src/types/calculator.ts

// ===================================
// INPUT: What the user provides
// ===================================
export interface ScenarioInputs {
    // Purchase info
    homePrice: number;                  // e.g., 500000
    downPaymentPercent: number;         // e.g., 20 (means 20%)
    interestRate: number;               // e.g., 7.0 (means 7%)
    loanTermYears: number;              // e.g., 30
    timeHorizonYears: number;           // e.g., 7 (how long user plans to stay)
    
    // Renting info
    monthlyRent: number;                // e.g., 2800
    
    // Costs (annual rates as percentages)
    propertyTaxRate: number;            // e.g., 1.0 (means 1% of home value)
    homeInsuranceAnnual: number;        // e.g., 1200 (dollars per year)
    hoaMonthly: number;                 // e.g., 150 (dollars per month)
    maintenanceRate: number;            // e.g., 1.0 (means 1% of home value annually)
    renterInsuranceAnnual: number;      // e.g., 240
    
    // Growth assumptions
    homeAppreciationRate: number;       // e.g., 3.0 (means 3% per year)
    rentGrowthRate: number;             // e.g., 3.5 (means 3.5% per year)
    investmentReturnRate: number;       // e.g., 7.0 (means 7% per year)
  }
  
  // ===================================
  // OUTPUT: What the calculations return
  // ===================================
  
  // Single month snapshot
  export interface MonthlySnapshot {
    month: number;                      // 1 to 360
    
    // Buying scenario
    mortgagePayment: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
    homeValue: number;
    homeEquity: number;
    monthlyBuyingCosts: number;
    
    // Renting scenario
    monthlyRent: number;
    monthlyRentingCosts: number;
    investedDownPayment: number;
    
    // Comparison
    buyerNetWorth: number;
    renterNetWorth: number;
    netWorthDelta: number;
  }
  
  // Full 30-year analysis
  export interface CalculatorOutput {
    inputs: ScenarioInputs;
    monthlySnapshots: MonthlySnapshot[];
    
    // Summary stats
    totalInterestPaid: number;
    totalPrincipalPaid: number;
    breakevenMonth: number | null;
    
    finalBuyerNetWorth: number;
    finalRenterNetWorth: number;
    finalNetWorthDelta: number;
  }