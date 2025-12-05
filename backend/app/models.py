
"""Pydantic models for finance analysis inputs and outputs."""

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ScenarioInputs(BaseModel):
    """User-provided scenario inputs."""

    homePrice: float = Field(..., gt=0)
    downPaymentPercent: float = Field(..., ge=0, le=100)
    interestRate: float = Field(..., ge=0)
    loanTermYears: int = Field(..., gt=0)
    timeHorizonYears: int = Field(..., gt=0)
    monthlyRent: float = Field(..., ge=0)
    propertyTaxRate: float = Field(..., ge=0)
    homeInsuranceAnnual: float = Field(..., ge=0)
    hoaMonthly: float = Field(..., ge=0)
    maintenanceRate: float = Field(..., ge=0)
    renterInsuranceAnnual: float = Field(..., ge=0)
    homeAppreciationRate: float = Field(..., ge=-100)
    rentGrowthRate: float = Field(..., ge=-100)
    investmentReturnRate: float = Field(..., ge=-100)


class MonthlySnapshot(BaseModel):
    month: int
    mortgagePayment: float
    principalPaid: float
    interestPaid: float
    remainingBalance: float
    homeValue: float
    homeEquity: float
    monthlyBuyingCosts: float
    monthlyRent: float
    monthlyRentingCosts: float
    investedDownPayment: float
    buyerNetWorth: float
    renterNetWorth: float
    netWorthDelta: float


class MonthlyCosts(BaseModel):
    mortgage: float
    propertyTax: float
    insurance: float
    hoa: float
    maintenance: float
    total: float


class RentingCosts(BaseModel):
    rent: float
    insurance: float
    total: float


class TotalCostSummary(BaseModel):
    buyerFinalNetWorth: float
    renterFinalNetWorth: float
    totalBuyingCosts: float
    totalRentingCosts: float
    finalHomeValue: float
    finalInvestmentValue: float


class CalculatorSummary(BaseModel):
    totalInterestPaid: float
    totalPrincipalPaid: float
    breakevenMonth: Optional[int]
    finalBuyerNetWorth: float
    finalRenterNetWorth: float
    finalNetWorthDelta: float

class CashFlowPoint(BaseModel):
    month: int
    homeownerCashFlow: float
    renterCashFlow: float


class CumulativeCostPoint(BaseModel):
    month: int
    cumulativeBuying: float
    cumulativeRenting: float


class LiquidityPoint(BaseModel):
    month: int
    homeownerCashAccount: float
    renterInvestmentBalance: float


class TaxSavingsPoint(BaseModel):
    year: int
    deductibleMortgageInterest: float
    deductiblePropertyTax: float
    totalTaxBenefit: float

class CalculatorOutput(BaseModel):
    inputs: ScenarioInputs
    monthlySnapshots: List[MonthlySnapshot]
    summary: CalculatorSummary
    monthlyCosts: MonthlyCosts
    rentingCosts: RentingCosts
    totals: TotalCostSummary
    cashFlow: Optional[List[CashFlowPoint]] = None
    cumulativeCosts: Optional[List[CumulativeCostPoint]] = None
    liquidityTimeline: Optional[List[LiquidityPoint]] = None
    taxSavings: Optional[List[TaxSavingsPoint]] = None


class AnalysisRequest(BaseModel):
    inputs: ScenarioInputs
    includeTimeline: bool = False
    zipCode: Optional[str] = None
    includeMonteCarlo: bool = False  # Make Monte Carlo optional - only run when explicitly requested
    monteCarloRuns: Optional[int] = None


class TimelinePoint(BaseModel):
    """Unified timeline point containing all data needed for charts."""
    month_index: int
    year: int

    net_worth_buy: float
    net_worth_rent: float

    total_cost_buy_to_date: float
    total_cost_rent_to_date: float

    buy_monthly_outflow: float
    rent_monthly_outflow: float

    mortgage_payment: float
    property_tax_monthly: float
    insurance_monthly: float
    maintenance_monthly: float
    hoa_monthly: float

    # Additional fields for backward compatibility and advanced charts
    principal_paid: float = 0.0
    interest_paid: float = 0.0
    remaining_balance: float = 0.0
    home_value: float = 0.0
    home_equity: float = 0.0
    renter_investment_balance: float = 0.0
    buyer_cash_account: float = 0.0


class BreakEvenInfo(BaseModel):
    month_index: Optional[int]
    year: Optional[int]


class HomePricePathSummary(BaseModel):
    """Monte Carlo home price path summary with percentile bands."""
    years: List[int]
    p10: List[float]  # 10th percentile prices for each year
    p50: List[float]  # 50th percentile (median) prices for each year
    p90: List[float]  # 90th percentile prices for each year


class AnalysisResult(BaseModel):
    """Unified analysis result - single source of truth for all charts."""
    timeline: List[TimelinePoint]
    break_even: BreakEvenInfo
    total_buy_cost: float
    total_rent_cost: float
    # Rates actually used in calculations (for frontend display)
    home_appreciation_rate: Optional[float] = None
    rent_growth_rate: Optional[float] = None
    # Monte Carlo home price path simulation (optional)
    monte_carlo_home_prices: Optional[HomePricePathSummary] = None


class AnalysisResponse(BaseModel):
    analysis: AnalysisResult


class HeatmapRequest(BaseModel):
    base: ScenarioInputs
    timelines: List[int]           # e.g., [5, 10, 15, 20]
    downPayments: List[float]      # percent list


class HeatmapPoint(BaseModel):
    timelineYears: int
    downPaymentPercent: float
    breakevenMonth: Optional[int]


class ScenarioRequest(BaseModel):
    scenarios: List[ScenarioInputs]


class ScenarioResult(BaseModel):
    scenario: ScenarioInputs
    output: CalculatorOutput


class SensitivityRequest(BaseModel):
    base: ScenarioInputs
    interestRateDelta: float = 0.0
    homePriceDelta: float = 0.0
    rentDelta: float = 0.0


class SensitivityResult(BaseModel):
    variant: str
    output: CalculatorOutput


class MonteCarloRequest(BaseModel):
    inputs: ScenarioInputs
    runs: int = 500


class MonteCarloRun(BaseModel):
    run: int
    finalBuyerNetWorth: float
    finalRenterNetWorth: float
    breakevenMonth: Optional[int]


class MonteCarloSummary(BaseModel):
    percentile10: float
    percentile50: float
    percentile90: float


class ChartInsightConversationMessage(BaseModel):
    question: str
    answer: str


class ChartInsightRequest(BaseModel):
    chartName: str
    chartData: Any
    question: str
    conversation: Optional[List[ChartInsightConversationMessage]] = None


class ChartInsightResponse(BaseModel):
    answer: str


class SummaryInsightRequest(BaseModel):
    zipCode: Optional[str] = None
    timelineYears: int
    buyNetWorth: List[float]
    rentNetWorth: List[float]
    breakEvenYear: Optional[int] = None
    finalDelta: float
    homeAppreciationRate: float
    rentGrowthRate: float


class SummaryInsightResponse(BaseModel):
    insight: str
