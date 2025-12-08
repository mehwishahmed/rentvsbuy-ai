// src/types/calculator.ts

// ===================================
// INPUT: What the user provides
// ===================================
export interface ScenarioInputs {
    // Purchase info
  homePrice: number; // e.g., 500000
  downPaymentPercent: number; // e.g., 20 (means 20%)
  interestRate: number; // e.g., 7.0 (means 7%)
  loanTermYears: number; // e.g., 30
  timeHorizonYears: number; // e.g., 7 (how long user plans to stay)
    
    // Renting info
  monthlyRent: number; // e.g., 2800
    
    // Costs (annual rates as percentages)
  propertyTaxRate: number; // e.g., 1.0 (means 1% of home value)
  homeInsuranceAnnual: number; // e.g., 1200 (dollars per year)
  hoaMonthly: number; // e.g., 150 (dollars per month)
  maintenanceRate: number; // e.g., 1.0 (means 1% of home value annually)
  renterInsuranceAnnual: number; // e.g., 240
    
    // Additional costs
  closingCostsPercent?: number; // e.g., 3.0 (means 3% of purchase price)
  pmiRate?: number; // e.g., 0.5 (means 0.5% annual of loan amount)
  sellingCostsPercent?: number; // e.g., 6.0 (means 6% of sale price)
    
    // Tax information
  federalTaxRate?: number; // e.g., 22 (means 22%)
  stateTaxRate?: number; // e.g., 5 (means 5%)
  taxFilingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
    
    // Growth assumptions
  homeAppreciationRate: number; // e.g., 3.0 (means 3% per year)
  rentGrowthRate: number; // e.g., 3.5 (means 3.5% per year)
  investmentReturnRate: number; // e.g., 7.0 (means 7% per year)
  }
  
  // ===================================
// OUTPUT: What the backend returns
  // ===================================
  
  // Single month snapshot
  export interface MonthlySnapshot {
  month: number; // 1 to 360
    
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
  
export interface BuyingCostsBreakdown {
  mortgage: number;
  propertyTax: number;
  insurance: number;
  hoa: number;
  maintenance: number;
  total: number;
}

export interface RentingCostsBreakdown {
  rent: number;
  insurance: number;
  total: number;
}

export interface TotalCostSummary {
  buyerFinalNetWorth: number;
  renterFinalNetWorth: number;
  totalBuyingCosts: number;
  totalRentingCosts: number;
  finalHomeValue: number;
  finalInvestmentValue: number;
}

export interface CalculatorSummary {
    totalInterestPaid: number;
    totalPrincipalPaid: number;
    breakevenMonth: number | null;
    finalBuyerNetWorth: number;
    finalRenterNetWorth: number;
    finalNetWorthDelta: number;
  }

export interface CashFlowPoint {
  month: number;
  homeownerCashFlow: number;
  renterCashFlow: number;
}

export interface CumulativeCostPoint {
  month: number;
  cumulativeBuying: number;
  cumulativeRenting: number;
}

export interface LiquidityPoint {
  month: number;
  homeownerCashAccount: number;
  renterInvestmentBalance: number;
}

export interface TaxSavingsPoint {
  year: number;
  deductibleMortgageInterest: number;
  deductiblePropertyTax: number;
  totalTaxBenefit: number;
}

export interface BreakEvenHeatmapPoint {
  timelineYears: number;
  downPaymentPercent: number;
  breakevenMonth: number | null;
}

export interface MonteCarloRun {
  run: number;
  finalBuyerNetWorth: number;
  finalRenterNetWorth: number;
  breakevenMonth: number | null;
}

export interface MonteCarloSummary {
  percentile10: number;
  percentile50: number;
  percentile90: number;
}

export interface MonteCarloResponse {
  runs: MonteCarloRun[];
  summary: MonteCarloSummary;
}

export interface SensitivityResult {
  variant: string;
  output: CalculatorOutput;
}

export interface SensitivityRequest {
  base: ScenarioInputs;
  interestRateDelta?: number;
  homePriceDelta?: number;
  rentDelta?: number;
}

export interface ScenarioResult {
  scenario: ScenarioInputs;
  output: CalculatorOutput;
}

export interface ScenarioRequest {
  scenarios: ScenarioInputs[];
}

export interface CalculatorOutput {
  inputs: ScenarioInputs;
  monthlySnapshots: MonthlySnapshot[];
  summary: CalculatorSummary;
  monthlyCosts: BuyingCostsBreakdown;
  rentingCosts: RentingCostsBreakdown;
  totals: TotalCostSummary;
  // --- ADDED ADVANCED FIELDS ---
  cashFlow?: CashFlowPoint[] | null;
  cumulativeCosts?: CumulativeCostPoint[] | null;
  liquidityTimeline?: LiquidityPoint[] | null;
  taxSavings?: TaxSavingsPoint[] | null;
}

export interface TimelinePoint {
  monthIndex: number;
  year: number;

  netWorthBuy: number;
  netWorthRent: number;

  totalCostBuyToDate: number;
  totalCostRentToDate: number;

  buyMonthlyOutflow: number;
  rentMonthlyOutflow: number;

  mortgagePayment: number;
  propertyTaxMonthly: number;
  insuranceMonthly: number;
  maintenanceMonthly: number;
  hoaMonthly: number;

  // Additional fields for backward compatibility and advanced charts
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  homeValue: number;
  homeEquity: number;
  renterInvestmentBalance: number;
  buyerCashAccount: number;
}

export interface BreakEvenInfo {
  monthIndex: number | null;
  year: number | null;
}

export interface HomePricePathSummary {
  years: number[];
  p10: number[];  // 10th percentile prices for each year
  p50: number[];  // 50th percentile (median) prices for each year
  p90: number[];  // 90th percentile prices for each year
}

export interface AnalysisResult {
  timeline: TimelinePoint[];
  breakEven: BreakEvenInfo;
  totalBuyCost: number;
  totalRentCost: number;
  // Rates actually used in calculations (from ML or fallback)
  // Backend returns snake_case, so we support both formats
  homeAppreciationRate?: number;
  rentGrowthRate?: number;
  home_appreciation_rate?: number; // snake_case from backend
  rent_growth_rate?: number; // snake_case from backend
  // Monte Carlo home price path simulation (optional)
  monteCarloHomePrices?: HomePricePathSummary;
  monte_carlo_home_prices?: HomePricePathSummary; // snake_case from backend
}

export interface AnalysisResponse {
  analysis: AnalysisResult;
}