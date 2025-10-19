// src/lib/finance/calculator.test.ts

import { describe, it, expect } from 'vitest';
import { 
    calculateMonthlyPayment, 
    generateAmortizationSchedule, 
    calculateBuyingCosts, 
    calculateRentingCosts,
    calculateNetWorthComparison,
  } from './calculator';
  import type { ScenarioInputs } from '../../types/calculator';

describe('calculateMonthlyPayment', () => {
  it('calculates correctly for typical scenario', () => {
    // $400,000 loan at 7% for 30 years
    // Expected: ~$2,661/month
    const result = calculateMonthlyPayment(400000, 7.0, 30);
    expect(result).toBeCloseTo(2661, 0);
  });
  
  it('calculates correctly for $500k at 6.5%', () => {
    const result = calculateMonthlyPayment(500000, 6.5, 30);
    expect(result).toBeCloseTo(3160, 0);
  });
  
  it('handles 0% interest rate', () => {
    const result = calculateMonthlyPayment(300000, 0, 30);
    expect(result).toBeCloseTo(833.33, 2);
  });
  
  it('returns 0 for $0 principal', () => {
    const result = calculateMonthlyPayment(0, 7.0, 30);
    expect(result).toBe(0);
  });
});

describe('generateAmortizationSchedule', () => {
  it('generates 360 months for 30-year loan', () => {
    const schedule = generateAmortizationSchedule(400000, 7.0, 30);
    expect(schedule).toHaveLength(360);
  });
  
  it('first payment is mostly interest', () => {
    const schedule = generateAmortizationSchedule(400000, 7.0, 30);
    const firstMonth = schedule[0];
    
    // First month: ~$2,333 interest, ~$328 principal
    expect(firstMonth.interestPaid).toBeGreaterThan(firstMonth.principalPaid);
    expect(firstMonth.interestPaid).toBeCloseTo(2333, 0);
    expect(firstMonth.principalPaid).toBeCloseTo(328, 0);
  });
  
  it('last payment is mostly principal', () => {
    const schedule = generateAmortizationSchedule(400000, 7.0, 30);
    const lastMonth = schedule[359]; // Month 360 is at index 359
    
    // Last month: almost all principal, very little interest
    expect(lastMonth.principalPaid).toBeGreaterThan(lastMonth.interestPaid);
  });
  
  it('final balance is $0', () => {
    const schedule = generateAmortizationSchedule(400000, 7.0, 30);
    const lastMonth = schedule[359];
    
    expect(lastMonth.remainingBalance).toBeCloseTo(0, 2);
  });
  
  it('total principal paid equals loan amount', () => {
    const schedule = generateAmortizationSchedule(400000, 7.0, 30);
    
    const totalPrincipal = schedule.reduce((sum: number, month) => sum + month.principalPaid, 0);
    
    expect(totalPrincipal).toBeCloseTo(400000, 0);
  });
});

describe('calculateBuyingCosts', () => {
  const testInputs: ScenarioInputs = {
    homePrice: 500000,
    downPaymentPercent: 20,
    interestRate: 7.0,
    loanTermYears: 30,
    monthlyRent: 2800,
    propertyTaxRate: 1.0,
    homeInsuranceAnnual: 1200,
    hoaMonthly: 150,
    maintenanceRate: 1.0,
    renterInsuranceAnnual: 240,
    homeAppreciationRate: 3.0,
    rentGrowthRate: 3.5,
    investmentReturnRate: 7.0
  };

  it('calculates all buying costs correctly', () => {
    const costs = calculateBuyingCosts(testInputs);
    
    // Mortgage on $400k loan at 7% for 30 years
    expect(costs.mortgage).toBeCloseTo(2661, 0);
    
    // Property tax: $500k * 1% / 12
    expect(costs.propertyTax).toBeCloseTo(417, 0);
    
    // Insurance: $1,200 / 12
    expect(costs.insurance).toBeCloseTo(100, 0);
    
    // HOA
    expect(costs.hoa).toBe(150);
    
    // Maintenance: $500k * 1% / 12
    expect(costs.maintenance).toBeCloseTo(417, 0);
    
    // Total
    expect(costs.total).toBeCloseTo(3745, 0);
  });
  
  it('handles no HOA', () => {
    const noHoaInputs = { ...testInputs, hoaMonthly: 0 };
    const costs = calculateBuyingCosts(noHoaInputs);
    
    expect(costs.hoa).toBe(0);
    expect(costs.total).toBeCloseTo(3595, 0); // $150 less than with HOA
  });
  
  it('handles 100% down payment (no mortgage)', () => {
    const cashInputs = { ...testInputs, downPaymentPercent: 100 };
    const costs = calculateBuyingCosts(cashInputs);
    
    expect(costs.mortgage).toBe(0);
    // Still have other costs
    expect(costs.propertyTax).toBeCloseTo(417, 0);
    expect(costs.total).toBeCloseTo(1083, 0); // No mortgage, just taxes/insurance/hoa/maintenance
  });
  
  it('handles expensive house', () => {
    const expensiveInputs = { ...testInputs, homePrice: 2000000 };
    const costs = calculateBuyingCosts(expensiveInputs);
    
    // Mortgage on $1.6M loan
    expect(costs.mortgage).toBeCloseTo(10645, 0);
    // Property tax: $2M * 1% / 12
    expect(costs.propertyTax).toBeCloseTo(1667, 0);
    // Total should be much higher
    expect(costs.total).toBeGreaterThan(10000);
  });
});

describe('calculateRentingCosts', () => {
    const testInputs: ScenarioInputs = {
      homePrice: 500000,
      downPaymentPercent: 20,
      interestRate: 7.0,
      loanTermYears: 30,
      monthlyRent: 2800,
      propertyTaxRate: 1.0,
      homeInsuranceAnnual: 1200,
      hoaMonthly: 150,
      maintenanceRate: 1.0,
      renterInsuranceAnnual: 240,
      homeAppreciationRate: 3.0,
      rentGrowthRate: 3.5,
      investmentReturnRate: 7.0
    };
  
    it('calculates first month rent correctly', () => {
      const costs = calculateRentingCosts(testInputs, 1);
      
      // First month: rent hasn't grown yet
      expect(costs.monthlyRent).toBe(2800);
      
      // Renter's insurance: $240 / 12
      expect(costs.insurance).toBe(20);
      
      // Total
      expect(costs.total).toBe(2820);
    });
    
    it('calculates rent with growth after 1 year', () => {
      const costs = calculateRentingCosts(testInputs, 13); // Month 13 = start of year 2
      
      // Rent should be 3.5% higher: $2,800 * 1.035
      expect(costs.monthlyRent).toBeCloseTo(2898, 0);
      expect(costs.total).toBeCloseTo(2918, 0);
    });
    
    it('calculates rent with growth after 5 years', () => {
      const costs = calculateRentingCosts(testInputs, 61); // Month 61 = start of year 6
      
      // Rent after 5 years of 3.5% growth: $2,800 * (1.035^5)
      expect(costs.monthlyRent).toBeCloseTo(3326, 0);
    });
    
    it('calculates rent after 10 years', () => {
      const costs = calculateRentingCosts(testInputs, 121); // Month 121 = start of year 11
      
      // Rent after 10 years: $2,800 * (1.035^10)
      expect(costs.monthlyRent).toBeCloseTo(3950, 0);
    });
    
    it('calculates rent after 30 years', () => {
      const costs = calculateRentingCosts(testInputs, 360); // Last month
      
      // Rent after 29 years of growth (month 360 is in year 29): $2,800 * (1.035^29)
      expect(costs.monthlyRent).toBeCloseTo(7593, 0);
    });
    
    it('handles 0% rent growth', () => {
      const noGrowthInputs = { ...testInputs, rentGrowthRate: 0 };
      
      // Check year 1
      const year1 = calculateRentingCosts(noGrowthInputs, 1);
      expect(year1.monthlyRent).toBe(2800);
      
      // Check year 10 - should still be same
      const year10 = calculateRentingCosts(noGrowthInputs, 121);
      expect(year10.monthlyRent).toBe(2800);
      
      // Check year 30 - should still be same
      const year30 = calculateRentingCosts(noGrowthInputs, 360);
      expect(year30.monthlyRent).toBe(2800);
    });
  });
  
  describe('calculateNetWorthComparison', () => {
    const testInputs: ScenarioInputs = {
      homePrice: 500000,
      downPaymentPercent: 20,
      interestRate: 7.0,
      loanTermYears: 30,
      monthlyRent: 2800,
      propertyTaxRate: 1.0,
      homeInsuranceAnnual: 1200,
      hoaMonthly: 150,
      maintenanceRate: 1.0,
      renterInsuranceAnnual: 240,
      homeAppreciationRate: 3.0,
      rentGrowthRate: 3.5,
      investmentReturnRate: 7.0
    };
  
    it('generates 360 monthly snapshots', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      expect(snapshots).toHaveLength(360);
    });
    
    it('first month has correct initial values', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      const month1 = snapshots[0];
      
      // Home value starts at purchase price
      expect(month1.homeValue).toBe(500000);
      
      // Mortgage balance starts at loan amount ($400k)
      expect(month1.remainingBalance).toBeCloseTo(399672, 0);
      
      // Initial equity = down payment
      expect(month1.homeEquity).toBeCloseTo(100328, 0);
      
      // Renter's invested down payment starts at $100k
      expect(month1.investedDownPayment).toBeCloseTo(100583, 0);
    });
    
    it('home value appreciates over time', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      
      // After 5 years (month 60): $500k * (1.03^5)
      const month60 = snapshots[59];
      expect(month60.homeValue).toBeCloseTo(578211, 0);
      
      // After 10 years (month 120): $500k * (1.03^10)
      const month120 = snapshots[119];
      expect(month120.homeValue).toBeCloseTo(670305, 0);
    });
    
    it('equity builds over time', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      
      const month1 = snapshots[0];
      const month60 = snapshots[59]; // 5 years
      const month360 = snapshots[359]; // 30 years
      
      // Equity should increase over time
      expect(month60.homeEquity).toBeGreaterThan(month1.homeEquity);
      expect(month360.homeEquity).toBeGreaterThan(month60.homeEquity);
    });
    
    it('invested down payment grows over time', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      
      const month1 = snapshots[0];
      const month60 = snapshots[59];
      const month360 = snapshots[359];
      
      // Investment should grow over time
      expect(month60.investedDownPayment).toBeGreaterThan(month1.investedDownPayment);
      expect(month360.investedDownPayment).toBeGreaterThan(month60.investedDownPayment);
      
      // After 30 years at 7% return: $100k should grow significantly
      expect(month360.investedDownPayment).toBeGreaterThan(700000);
    });
    
    it('calculates net worth delta correctly', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      
      const month60 = snapshots[59];
      
      // Delta = buyer net worth - renter net worth
      expect(month60.netWorthDelta).toBe(month60.buyerNetWorth - month60.renterNetWorth);
    });
    
    it('mortgage balance decreases to near zero by month 360', () => {
      const snapshots = calculateNetWorthComparison(testInputs);
      
      const finalMonth = snapshots[359];
      
      // After 30 years, mortgage should be paid off
      expect(finalMonth.remainingBalance).toBeCloseTo(0, 2);
    });
  });