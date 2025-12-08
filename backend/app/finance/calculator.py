from __future__ import annotations

"""Finance calculator logic mirrored from the TypeScript implementation."""

import random
import numpy as np

from dataclasses import dataclass
from math import pow
from typing import Iterable, List

from ..models import (
    AnalysisResult,
    BreakEvenInfo,
    CalculatorOutput,
    CalculatorSummary,
    MonthlyCosts,
    MonthlySnapshot,
    RentingCosts,
    ScenarioInputs,
    TimelinePoint,
    TotalCostSummary,
)


@dataclass
class AmortizationMonth:
    month: int
    payment: float
    principal_paid: float
    interest_paid: float
    remaining_balance: float


def get_timeline_multiplier(time_horizon_years: int) -> float:
    if time_horizon_years <= 3:
        return 0.1
    if time_horizon_years <= 7:
        return 0.5
    return 1.0


def get_timeline_based_rates(time_horizon_years: int) -> dict[str, float]:
    if time_horizon_years <= 3:
        return {
            "homeAppreciationRate": 0.5,
            "rentGrowthRate": 2.0,
            "investmentReturnRate": 4.0,
        }
    if time_horizon_years <= 7:
        return {
            "homeAppreciationRate": 1.5,
            "rentGrowthRate": 3.0,
            "investmentReturnRate": 6.0,
        }
    return {
        "homeAppreciationRate": 2.5,
        "rentGrowthRate": 3.5,
        "investmentReturnRate": 7.0,
    }


def calculate_monthly_payment(principal: float, annual_interest_rate: float, loan_term_years: int) -> float:
    if principal <= 0:
        return 0.0

    if annual_interest_rate == 0:
        return principal / (loan_term_years * 12)

    monthly_rate = annual_interest_rate / 100 / 12
    num_payments = loan_term_years * 12
    factor = pow(1 + monthly_rate, num_payments)
    numerator = monthly_rate * factor
    denominator = factor - 1
    if denominator == 0:
        return 0.0
    return principal * (numerator / denominator)


def generate_amortization_schedule(
    principal: float, annual_interest_rate: float, loan_term_years: int
) -> List[AmortizationMonth]:
    schedule: List[AmortizationMonth] = []
    monthly_payment = calculate_monthly_payment(principal, annual_interest_rate, loan_term_years)
    monthly_rate = annual_interest_rate / 100 / 12
    num_payments = loan_term_years * 12
    remaining_balance = principal

    for month in range(1, num_payments + 1):
        interest_paid = remaining_balance * monthly_rate if monthly_rate > 0 else 0.0
        principal_paid = monthly_payment - interest_paid
        if principal_paid < 0:
            principal_paid = 0.0
        remaining_balance = max(0.0, remaining_balance - principal_paid)
        schedule.append(
            AmortizationMonth(
                month=month,
                payment=monthly_payment,
                principal_paid=principal_paid,
                interest_paid=interest_paid,
                remaining_balance=remaining_balance,
            )
        )

    return schedule


def calculate_buying_costs(inputs: ScenarioInputs) -> MonthlyCosts:
    down_payment_amount = inputs.homePrice * (inputs.downPaymentPercent / 100)
    loan_amount = max(0.0, inputs.homePrice - down_payment_amount)

    mortgage = calculate_monthly_payment(loan_amount, inputs.interestRate, inputs.loanTermYears)
    property_tax = (inputs.homePrice * (inputs.propertyTaxRate / 100)) / 12
    insurance = inputs.homeInsuranceAnnual / 12
    hoa = inputs.hoaMonthly
    maintenance = (inputs.homePrice * (inputs.maintenanceRate / 100)) / 12
    total = mortgage + property_tax + insurance + hoa + maintenance

    return MonthlyCosts(
        mortgage=mortgage,
        propertyTax=property_tax,
        insurance=insurance,
        hoa=hoa,
        maintenance=maintenance,
        total=total,
    )


def calculate_renting_costs(inputs: ScenarioInputs, month: int) -> RentingCosts:
    if month < 1:
        raise ValueError("month must be >= 1")

    year = (month - 1) // 12
    growth_multiplier = pow(1 + inputs.rentGrowthRate / 100, year)
    monthly_rent = inputs.monthlyRent * growth_multiplier
    insurance = inputs.renterInsuranceAnnual / 12
    total = monthly_rent + insurance

    return RentingCosts(rent=monthly_rent, insurance=insurance, total=total)


def _calculate_pmi(loan_amount: float, pmi_rate: float = 0.5) -> float:
    """Calculate PMI monthly payment. Default 0.5% annual if not specified."""
    return (loan_amount * (pmi_rate / 100)) / 12


def calculate_net_worth_comparison(inputs: ScenarioInputs) -> List[MonthlySnapshot]:
    down_payment_amount = inputs.homePrice * (inputs.downPaymentPercent / 100)
    loan_amount = max(0.0, inputs.homePrice - down_payment_amount)

    amortization = generate_amortization_schedule(loan_amount, inputs.interestRate, 30)
    timeline_months = inputs.timeHorizonYears * 12

    monthly_investment_return = inputs.investmentReturnRate / 100 / 12
    monthly_home_appreciation = inputs.homeAppreciationRate / 100 / 12
    monthly_rent_growth = inputs.rentGrowthRate / 100 / 12

    home_value = inputs.homePrice
    remaining_balance = loan_amount
    rent = inputs.monthlyRent

    closing_costs_percent = inputs.closingCostsPercent if hasattr(inputs, 'closingCostsPercent') and inputs.closingCostsPercent is not None else 3.0
    closing_costs_buy = inputs.homePrice * (closing_costs_percent / 100)
    selling_costs_percent = inputs.sellingCostsPercent if hasattr(inputs, 'sellingCostsPercent') and inputs.sellingCostsPercent is not None else 6.0
    closing_costs_sell_rate = selling_costs_percent / 100

    buyer_cash_account = -down_payment_amount - closing_costs_buy
    buyer_equity = down_payment_amount
    renter_portfolio = down_payment_amount

    snapshots: List[MonthlySnapshot] = []

    for month in range(1, timeline_months + 1):
        amort_month = amortization[month - 1]

        home_value *= 1 + monthly_home_appreciation
        rent *= 1 + monthly_rent_growth

        interest_paid = remaining_balance * (inputs.interestRate / 100 / 12)
        principal_paid = amort_month.payment - interest_paid
        if principal_paid < 0:
            principal_paid = 0.0
        remaining_balance = max(0.0, remaining_balance - principal_paid)
        buyer_equity = home_value - remaining_balance

        property_tax_monthly = (inputs.propertyTaxRate / 100 * home_value) / 12
        insurance_monthly = inputs.homeInsuranceAnnual / 12
        maintenance_monthly = (inputs.maintenanceRate / 100 * home_value) / 12
        hoa_monthly = inputs.hoaMonthly

        has_pmi = remaining_balance / home_value > 0.80 if home_value > 0 else False
        pmi_rate = inputs.pmiRate if hasattr(inputs, 'pmiRate') and inputs.pmiRate is not None else 0.5
        pmi_monthly = _calculate_pmi(loan_amount, pmi_rate) if has_pmi else 0.0

        owner_monthly_cost = (
            interest_paid
            + property_tax_monthly
            + insurance_monthly
            + maintenance_monthly
            + hoa_monthly
            + pmi_monthly
        )

        renter_monthly_cost = rent
        cash_flow_diff = renter_monthly_cost - owner_monthly_cost

        if cash_flow_diff > 0:
            # Renting costs more - buyer saves money, invests the difference
            buyer_cash_account = (buyer_cash_account + cash_flow_diff) * (1 + monthly_investment_return)
            renter_portfolio = renter_portfolio * (1 + monthly_investment_return)
        else:
            # Owning costs more - renter saves money, invests the difference
            renter_portfolio = (renter_portfolio + abs(cash_flow_diff)) * (1 + monthly_investment_return)
            buyer_cash_account = buyer_cash_account * (1 + monthly_investment_return)

        is_final_month = month == timeline_months
        selling_costs = home_value * closing_costs_sell_rate if is_final_month else 0.0

        buyer_net_worth = (buyer_equity - selling_costs) + buyer_cash_account
        renter_net_worth = renter_portfolio
        net_worth_delta = buyer_net_worth - renter_net_worth

        snapshots.append(
            MonthlySnapshot(
                month=month,
                mortgagePayment=amort_month.payment,
                principalPaid=principal_paid,
                interestPaid=interest_paid,
                remainingBalance=remaining_balance,
                homeValue=home_value,
                homeEquity=buyer_equity,
                monthlyBuyingCosts=owner_monthly_cost,
                monthlyRent=rent,
                monthlyRentingCosts=renter_monthly_cost,
                investedDownPayment=renter_portfolio,
                buyerNetWorth=buyer_net_worth,
                renterNetWorth=renter_net_worth,
                netWorthDelta=net_worth_delta,
            )
        )

    return snapshots


def _compute_summary(snapshots: Iterable[MonthlySnapshot]) -> CalculatorSummary:
    snapshots_list = list(snapshots)
    total_interest_paid = sum(s.interestPaid for s in snapshots_list)
    total_principal_paid = sum(s.principalPaid for s in snapshots_list)

    breakeven_month = None
    for snapshot in snapshots_list:
        if snapshot.netWorthDelta >= 0:
            breakeven_month = snapshot.month
            break

    final_snapshot = snapshots_list[-1]

    return CalculatorSummary(
        totalInterestPaid=total_interest_paid,
        totalPrincipalPaid=total_principal_paid,
        breakevenMonth=breakeven_month,
        finalBuyerNetWorth=final_snapshot.buyerNetWorth,
        finalRenterNetWorth=final_snapshot.renterNetWorth,
        finalNetWorthDelta=final_snapshot.netWorthDelta,
    )


def calculate_unified_analysis(inputs: ScenarioInputs) -> AnalysisResult:
    """Build unified AnalysisResult with all data in TimelinePoint structure."""
    down_payment_amount = inputs.homePrice * (inputs.downPaymentPercent / 100)
    loan_amount = max(0.0, inputs.homePrice - down_payment_amount)

    amortization = generate_amortization_schedule(loan_amount, inputs.interestRate, 30)
    timeline_months = inputs.timeHorizonYears * 12

    monthly_investment_return = inputs.investmentReturnRate / 100 / 12
    monthly_home_appreciation = inputs.homeAppreciationRate / 100 / 12
    monthly_rent_growth = inputs.rentGrowthRate / 100 / 12

    home_value = inputs.homePrice
    remaining_balance = loan_amount
    rent = inputs.monthlyRent

    closing_costs_percent = inputs.closingCostsPercent if hasattr(inputs, 'closingCostsPercent') and inputs.closingCostsPercent is not None else 3.0
    closing_costs_buy = inputs.homePrice * (closing_costs_percent / 100)
    selling_costs_percent = inputs.sellingCostsPercent if hasattr(inputs, 'sellingCostsPercent') and inputs.sellingCostsPercent is not None else 6.0
    closing_costs_sell_rate = selling_costs_percent / 100

    buyer_cash_account = -down_payment_amount - closing_costs_buy
    buyer_equity = down_payment_amount
    renter_portfolio = down_payment_amount

    timeline: List[TimelinePoint] = []
    total_cost_buy = down_payment_amount + closing_costs_buy
    total_cost_rent = 0.0
    breakeven_month_index = None
    breakeven_year = None

    for month in range(1, timeline_months + 1):
        amort_month = amortization[month - 1]

        home_value *= 1 + monthly_home_appreciation
        rent *= 1 + monthly_rent_growth

        interest_paid = remaining_balance * (inputs.interestRate / 100 / 12)
        principal_paid = amort_month.payment - interest_paid
        if principal_paid < 0:
            principal_paid = 0.0
        remaining_balance = max(0.0, remaining_balance - principal_paid)
        buyer_equity = home_value - remaining_balance

        property_tax_monthly = (inputs.propertyTaxRate / 100 * home_value) / 12
        insurance_monthly = inputs.homeInsuranceAnnual / 12
        maintenance_monthly = (inputs.maintenanceRate / 100 * home_value) / 12
        hoa_monthly = inputs.hoaMonthly

        has_pmi = remaining_balance / home_value > 0.80 if home_value > 0 else False
        pmi_rate = inputs.pmiRate if hasattr(inputs, 'pmiRate') and inputs.pmiRate is not None else 0.5
        pmi_monthly = _calculate_pmi(loan_amount, pmi_rate) if has_pmi else 0.0

        owner_monthly_cost = (
            interest_paid
            + property_tax_monthly
            + insurance_monthly
            + maintenance_monthly
            + hoa_monthly
            + pmi_monthly
        )

        renter_monthly_cost = rent
        cash_flow_diff = renter_monthly_cost - owner_monthly_cost

        if cash_flow_diff > 0:
            # Renting costs more - buyer saves money, invests the difference
            buyer_cash_account = (buyer_cash_account + cash_flow_diff) * (1 + monthly_investment_return)
            renter_portfolio = renter_portfolio * (1 + monthly_investment_return)
        else:
            # Owning costs more - renter saves money, invests the difference
            renter_portfolio = (renter_portfolio + abs(cash_flow_diff)) * (1 + monthly_investment_return)
            buyer_cash_account = buyer_cash_account * (1 + monthly_investment_return)

        is_final_month = month == timeline_months
        selling_costs = home_value * closing_costs_sell_rate if is_final_month else 0.0

        buyer_net_worth = (buyer_equity - selling_costs) + buyer_cash_account
        renter_net_worth = renter_portfolio
        net_worth_delta = buyer_net_worth - renter_net_worth

        # Track cumulative costs
        total_cost_buy += owner_monthly_cost
        total_cost_rent += renter_monthly_cost
        if is_final_month:
            total_cost_buy += selling_costs

        # Track break-even
        if breakeven_month_index is None and net_worth_delta >= 0:
            breakeven_month_index = month
            breakeven_year = (month - 1) // 12 + 1

        year = (month - 1) // 12 + 1

        timeline.append(
            TimelinePoint(
                month_index=month,
                year=year,
                net_worth_buy=buyer_net_worth,
                net_worth_rent=renter_net_worth,
                total_cost_buy_to_date=total_cost_buy,
                total_cost_rent_to_date=total_cost_rent,
                buy_monthly_outflow=owner_monthly_cost,
                rent_monthly_outflow=renter_monthly_cost,
                mortgage_payment=amort_month.payment,
                property_tax_monthly=property_tax_monthly,
                insurance_monthly=insurance_monthly,
                maintenance_monthly=maintenance_monthly,
                hoa_monthly=hoa_monthly,
                principal_paid=principal_paid,
                interest_paid=interest_paid,
                remaining_balance=remaining_balance,
                home_value=home_value,
                home_equity=buyer_equity,
                renter_investment_balance=renter_portfolio,
                buyer_cash_account=buyer_cash_account,
            )
        )

    break_even = BreakEvenInfo(
        month_index=breakeven_month_index,
        year=breakeven_year,
    )

    return AnalysisResult(
        timeline=timeline,
        break_even=break_even,
        total_buy_cost=total_cost_buy,
        total_rent_cost=total_cost_rent,
    )


def calculate_analysis(inputs: ScenarioInputs) -> CalculatorOutput:
    snapshots = calculate_net_worth_comparison(inputs)
    buying_costs = calculate_buying_costs(inputs)
    renting_costs_month_one = calculate_renting_costs(inputs, 1)
    summary = _compute_summary(snapshots)
    total_buying_costs = sum(s.monthlyBuyingCosts for s in snapshots)
    total_renting_costs = sum(s.monthlyRentingCosts for s in snapshots)
    final_snapshot = snapshots[-1]
    totals = TotalCostSummary(
        buyerFinalNetWorth=final_snapshot.buyerNetWorth,
        renterFinalNetWorth=final_snapshot.renterNetWorth,
        totalBuyingCosts=total_buying_costs,
        totalRentingCosts=total_renting_costs,
        finalHomeValue=final_snapshot.homeValue,
        finalInvestmentValue=final_snapshot.investedDownPayment,
    )
    # Extended analytics locations (for direct analyze API)
    cash_flow = calculate_cash_flow(snapshots)
    cum_costs = calculate_cumulative_costs(snapshots)
    liquidity = calculate_liquidity_timeline(snapshots)
    tax_savings = calculate_tax_savings(inputs, snapshots)  # using default bracket/income
    return CalculatorOutput(
        inputs=inputs,
        monthlySnapshots=snapshots,
        summary=summary,
        monthlyCosts=buying_costs,
        rentingCosts=renting_costs_month_one,
        totals=totals,
        cashFlow=cash_flow,
        cumulativeCosts=cum_costs,
        liquidityTimeline=liquidity,
        taxSavings=tax_savings,
    )

def calculate_cash_flow(snapshots: list[MonthlySnapshot]) -> list[dict]:
    result = []
    for snap in snapshots:
        result.append({
            'month': snap.month,
            'homeownerCashFlow': snap.monthlyRentingCosts - snap.monthlyBuyingCosts,  # cash diff each month
            'renterCashFlow': snap.monthlyRentingCosts
        })
    return result

def calculate_cumulative_costs(snapshots: list[MonthlySnapshot]) -> list[dict]:
    result = []
    cum_buy, cum_rent = 0.0, 0.0
    for snap in snapshots:
        cum_buy += snap.monthlyBuyingCosts
        cum_rent += snap.monthlyRentingCosts
        result.append({
            'month': snap.month,
            'cumulativeBuying': cum_buy,
            'cumulativeRenting': cum_rent,
        })
    return result

def calculate_liquidity_timeline(snapshots: list[MonthlySnapshot]) -> list[dict]:
    result = []
    # monthly snapshots must be expanded to expose cash & investment
    # defaults to 0 if not present
    for snap in snapshots:
        result.append({
            'month': snap.month,
            'homeownerCashAccount': getattr(snap, 'buyerNetWorth', 0),
            'renterInvestmentBalance': getattr(snap, 'renterNetWorth', 0),
        })
    return result

def calculate_tax_savings(inputs: ScenarioInputs, snapshots: list[MonthlySnapshot], income: float = 100000, tax_bracket: float = 0.24) -> list[dict]:
    # Simple US deduction simulation by year: itemized interest + property tax, up to IRS limits.
    # Default bracket is 24% (median). User can override by argument/in API.
    mortgage_interest_per_year = []
    property_tax_per_year = []
    result = []
    year_snaps = [snapshots[i*12:(i+1)*12] for i in range(len(snapshots)//12+1)]
    for year, months in enumerate(year_snaps, 1):
        tot_interest = sum(m.interestPaid for m in months)
        tot_property_tax = sum((inputs.propertyTaxRate/100 * m.homeValue)/12 for m in months)
        deductible_interest = min(tot_interest, 750000)  # $750k loan limit for deduction
        deductible_tax = min(tot_property_tax, 10000)  # $10k SALT limit
        tax_benefit = (deductible_interest + deductible_tax) * tax_bracket
        result.append({
            'year': year,
            'deductibleMortgageInterest': deductible_interest,
            'deductiblePropertyTax': deductible_tax,
            'totalTaxBenefit': tax_benefit,
        })
    return result

def calculate_sensitivity(base: ScenarioInputs, interest_rate_delta=0.0, home_price_delta=0.0, rent_delta=0.0):
    # Returns a list of (variant, CalculatorOutput)
    variants = []
    # -/0/+ for each delta type
    for label, mod in [('interest-', -interest_rate_delta), ('interest+', interest_rate_delta)]:
        modified = base.copy(update={'interestRate': base.interestRate + mod})
        variants.append({'variant': label, 'output': calculate_analysis(modified)})
    for label, mod in [('price-', -home_price_delta), ('price+', home_price_delta)]:
        modified = base.copy(update={'homePrice': base.homePrice + mod})
        variants.append({'variant': label, 'output': calculate_analysis(modified)})
    for label, mod in [('rent-', -rent_delta), ('rent+', rent_delta)]:
        modified = base.copy(update={'monthlyRent': base.monthlyRent + mod})
        variants.append({'variant': label, 'output': calculate_analysis(modified)})
    return variants

def calculate_scenarios(scenarios: list[ScenarioInputs]):
    return [{'scenario': s, 'output': calculate_analysis(s)} for s in scenarios]

def calculate_heatmap(timelines: list[int], downpayments: list[float], base: ScenarioInputs):
    result = []
    for t in timelines:
        for dp in downpayments:
            inputs = base.copy(update={'timeHorizonYears': t, 'downPaymentPercent': dp})
            out = calculate_unified_analysis(inputs)
            result.append({
                'timelineYears': t,
                'downPaymentPercent': dp,
                'breakevenMonth': out.break_even.month_index
            })
    return result


def calculate_monte_carlo(inputs: ScenarioInputs, runs: int = 500):
    results = []
    for run in range(runs):
        # Randomize appreciation, rent, investment returns ~ Normal(centered at input, stdev 1.5% for apprec/rent, 2.5% for invest)
        scenario = inputs.copy(update={
            'homeAppreciationRate': random.gauss(inputs.homeAppreciationRate, 1.5),
            'rentGrowthRate':  random.gauss(inputs.rentGrowthRate, 1.5),
            'investmentReturnRate': random.gauss(inputs.investmentReturnRate, 2.5)
        })
        out = calculate_analysis(scenario)
        results.append({
            'run': run+1,
            'finalBuyerNetWorth': out.totals.buyerFinalNetWorth,
            'finalRenterNetWorth': out.totals.renterFinalNetWorth,
            'breakevenMonth': out.summary.breakevenMonth
        })
    final_nw = [r['finalBuyerNetWorth']-r['finalRenterNetWorth'] for r in results]
    percentiles = np.percentile(final_nw, [10, 50, 90])
    summary = {'percentile10': percentiles[0], 'percentile50': percentiles[1], 'percentile90': percentiles[2]}
    return {'runs': results, 'summary': summary}
