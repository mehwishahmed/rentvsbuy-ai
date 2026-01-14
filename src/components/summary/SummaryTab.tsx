// src/components/summary/SummaryTab.tsx

import { useState } from 'react';
import { NetWorthChart } from '../charts/NetWorthChart';
import type { AnalysisResult, TimelinePoint } from '../../types/calculator';
import { generateSummaryInsight } from '../../lib/api/finance';
import { KeyMetricCard } from './KeyMetricCard';

interface SummaryTabProps {
  analysis: AnalysisResult | null;
  zipCode?: string | null;
}

export function SummaryTab({ analysis, zipCode }: SummaryTabProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // If no analysis, show placeholder
  if (!analysis || !analysis.timeline || analysis.timeline.length === 0) {
    return (
      <div className="summary-empty-state">
        <h2>Run an analysis first</h2>
        <p>Complete a scenario in the Chat & Setup tab to see your summary here.</p>
      </div>
    );
  }

  // Calculate metrics from analysis
  const timeline = analysis.timeline;
  const lastPoint = timeline[timeline.length - 1];

  // Helper to get net worth values (handle both camelCase and snake_case from backend)
  const getNetWorthBuy = (point: TimelinePoint | any) => (point as any).net_worth_buy ?? point.netWorthBuy ?? 0;
  const getNetWorthRent = (point: TimelinePoint | any) => (point as any).net_worth_rent ?? point.netWorthRent ?? 0;
  const getHomeEquity = (point: TimelinePoint | any) => (point as any).home_equity ?? point.homeEquity ?? 0;
  const getMonthIndex = (point: TimelinePoint | any) => (point as any).month_index ?? point.monthIndex ?? 0;

  // Break-even year calculation
  const breakEvenPoint = timeline.find(
    (point: TimelinePoint) => getNetWorthBuy(point) >= getNetWorthRent(point)
  );
  const breakEvenYear = breakEvenPoint 
    ? Math.ceil(getMonthIndex(breakEvenPoint) / 12) 
    : null;

  // Net worth difference at end
  const finalDelta = getNetWorthBuy(lastPoint) - getNetWorthRent(lastPoint);
  const isBuyAhead = finalDelta > 0;
  const isValidDelta = !isNaN(finalDelta) && isFinite(finalDelta);

  // Total equity at end
  const finalEquity = getHomeEquity(lastPoint);

  // Total costs (handle both camelCase and snake_case from backend)
  const totalBuyCost = (analysis as any).total_buy_cost ?? analysis.totalBuyCost ?? 0;
  const totalRentCost = (analysis as any).total_rent_cost ?? analysis.totalRentCost ?? 0;

  // Growth rates (handle both camelCase and snake_case from backend)
  const homeAppreciationRate = analysis.homeAppreciationRate ?? analysis.home_appreciation_rate ?? 0;
  const rentGrowthRate = analysis.rentGrowthRate ?? analysis.rent_growth_rate ?? 0;

  // Handle AI insight generation
  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    setInsightError(null);
    
    try {
      // Use helper functions to get net worth values (handles both camelCase and snake_case)
      const buyNetWorth = timeline.map((p: TimelinePoint) => getNetWorthBuy(p));
      const rentNetWorth = timeline.map((p: TimelinePoint) => getNetWorthRent(p));
      
      const result = await generateSummaryInsight({
        zipCode: zipCode || undefined,
        timelineYears: Math.ceil(timeline.length / 12),
        buyNetWorth,
        rentNetWorth,
        breakEvenYear: breakEvenYear || undefined,
        finalDelta,
        homeAppreciationRate,
        rentGrowthRate,
      });
      
      setInsight(result.insight);
    } catch (error) {
      console.error('Failed to generate insight:', error);
      setInsightError('Sorry, I couldn\'t generate a summary right now. Please try again.');
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="summary-tab-container">
      {/* Top Row: Chart + Metrics side by side */}
      <div className="summary-top-row">
        {/* Left: Chart */}
        <section className="hero-chart-wrapper" data-tour-id="summary-hero-chart">
          <div style={{ marginBottom: '4px' }}>
            <h2 style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: 'rgba(255, 255, 255, 0.95)', 
              marginBottom: '2px' 
            }}>
              Net Worth: Buy vs Rent
            </h2>
          </div>
          <NetWorthChart timeline={timeline} />
        </section>

        {/* Right: Key Metrics */}
        <div className="metrics-panel" data-tour-id="summary-metrics">
          <h3 className="metrics-panel-title">Key Metrics</h3>
          <div className="metrics-grid-vertical">
            <KeyMetricCard
              icon="⏱️"
              label="BREAK-EVEN"
              value={breakEvenYear ? `Year ${breakEvenYear}` : 'N/A'}
              subtitle={breakEvenYear ? 'When buying wins' : ''}
              variant="neutral"
            />
            <KeyMetricCard
              icon="📈"
              label="NET WORTH DIFF"
              value={isValidDelta ? (isBuyAhead ? `+$${Math.abs(finalDelta).toLocaleString()}` : `-$${Math.abs(finalDelta).toLocaleString()}`) : '...'}
              subtitle={isBuyAhead ? 'Buy ahead' : 'Rent ahead'}
              variant={isValidDelta ? (isBuyAhead ? 'positive' : 'negative') : 'neutral'}
            />
            <KeyMetricCard
              icon="🏠"
              label="EQUITY"
              value={`$${(isNaN(finalEquity) || !isFinite(finalEquity) ? 0 : finalEquity).toLocaleString()}`}
              subtitle="At end"
              variant="neutral"
            />
            <KeyMetricCard
              icon="🧾"
              label="BUY COST"
              value={`$${(isNaN(totalBuyCost) || !isFinite(totalBuyCost) ? 0 : Math.round(totalBuyCost/1000)).toLocaleString()}k`}
              subtitle={`Rent: $${(isNaN(totalRentCost) || !isFinite(totalRentCost) ? 0 : Math.round(totalRentCost/1000)).toLocaleString()}k`}
              variant="neutral"
            />
            <KeyMetricCard
              icon="📊"
              label="APPRECIATION"
              value={`${homeAppreciationRate.toFixed(1)}%`}
              subtitle="Home growth"
              variant="neutral"
            />
            <KeyMetricCard
              icon="📉"
              label="RENT GROWTH"
              value={`${rentGrowthRate.toFixed(1)}%`}
              subtitle="Annual"
              variant="neutral"
            />
          </div>
        </div>
      </div>

      {/* Bottom: AI Insight Box */}
      <div className="insight-box" data-tour-id="summary-insights">
        <h3 className="insight-box-title">AI Summary</h3>
        {!insight && !insightLoading && !insightError && (
          <button
            className="insight-generate-button"
            onClick={handleGenerateInsight}
          >
            Generate Insight
          </button>
        )}
        {insightLoading && (
          <div className="insight-loading">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Generating...</p>
          </div>
        )}
        {insightError && (
          <div className="insight-error">
            <p>{insightError}</p>
            <button className="insight-retry-button" onClick={handleGenerateInsight}>
              Retry
            </button>
          </div>
        )}
        {insight && (
          <div className="insight-content">
            <p>{insight}</p>
            <button className="insight-regenerate-button" onClick={handleGenerateInsight}>
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

