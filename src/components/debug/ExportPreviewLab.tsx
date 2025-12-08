// src/components/debug/ExportPreviewLab.tsx

import { useState, useRef } from 'react';
import type { AnalysisResult } from '../../types/calculator';
import { captureElementToCanvas } from '../../lib/export/html2canvasExport';
import { NetWorthChart } from '../charts/NetWorthChart';
import { MonthlyCostChart } from '../charts/MonthlyCostChart';
import { TotalCostChart } from '../charts/TotalCostChart';
import { EquityBuildupChart } from '../charts/EquityBuildupChart';
import { RentGrowthChart } from '../charts/RentGrowthChart';
import { BreakEvenChart } from '../charts/BreakEvenChart';
import { CashFlowChart } from '../charts/CashFlowChart';
import { CumulativeCostChart } from '../charts/CumulativeCostChart';
import { TaxSavingsChart } from '../charts/TaxSavingsChart';
import { MonteCarloChart } from '../charts/MonteCarloChart';
import { SensitivityChart } from '../charts/SensitivityChart';
import { BreakEvenHeatmap } from '../charts/BreakEvenHeatmap';
import { ScenarioOverlayChart } from '../charts/ScenarioOverlayChart';
import type { TimelinePoint, CashFlowPoint, CumulativeCostPoint, TaxSavingsPoint, BreakEvenHeatmapPoint, HomePricePathSummary, SensitivityResult, ScenarioResult } from '../../types/calculator';

interface ExportPreviewLabProps {
  analysis: AnalysisResult | null;
  // Additional data needed for some charts
  timeline?: TimelinePoint[];
  totalCostData?: any;
  monthlyCosts?: any;
  heatmapData?: BreakEvenHeatmapPoint[];
  monteCarloData?: HomePricePathSummary;
  sensitivityData?: SensitivityResult[];
  scenarioOverlayData?: ScenarioResult[];
}

interface PreviewConfig {
  id: string;
  label: string;
  render: (props: ExportPreviewLabProps) => React.ReactNode;
}

export function ExportPreviewLab({
  analysis,
  timeline,
  totalCostData,
  monthlyCosts,
  heatmapData,
  monteCarloData,
  sensitivityData,
  scenarioOverlayData,
}: ExportPreviewLabProps) {
  const [previews, setPreviews] = useState<{ id: string; label: string; dataUrl: string }[]>([]);
  const [currentChartId, setCurrentChartId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const previewConfigs: PreviewConfig[] = [
    {
      id: 'netWorth',
      label: 'Net Worth Comparison',
      render: (props) => {
        if (!props.analysis?.timeline || props.analysis.timeline.length === 0) return null;
        return <NetWorthChart timeline={props.analysis.timeline} />;
      },
    },
    {
      id: 'monthlyCost',
      label: 'Monthly Cost Breakdown',
      render: (props) => {
        const chartTimeline = props.timeline || props.analysis?.timeline || [];
        if (chartTimeline.length === 0 && !props.monthlyCosts) return null;
        if (chartTimeline.length > 0) {
          return <MonthlyCostChart timeline={chartTimeline} />;
        }
        // Fallback to monthlyCosts if available
        if (props.monthlyCosts) {
          return (
            <MonthlyCostChart
              timeline={[{
                monthIndex: 1,
                year: 1,
                netWorthBuy: 0,
                netWorthRent: 0,
                totalCostBuyToDate: 0,
                totalCostRentToDate: 0,
                buyMonthlyOutflow: props.monthlyCosts.buying?.total || 0,
                rentMonthlyOutflow: props.monthlyCosts.renting?.total || 0,
                mortgagePayment: props.monthlyCosts.buying?.mortgage || 0,
                propertyTaxMonthly: props.monthlyCosts.buying?.propertyTax || 0,
                insuranceMonthly: props.monthlyCosts.buying?.insurance || 0,
                maintenanceMonthly: props.monthlyCosts.buying?.maintenance || 0,
                hoaMonthly: props.monthlyCosts.buying?.hoa || 0,
                principalPaid: 0,
                interestPaid: 0,
                remainingBalance: 0,
                homeValue: 0,
                homeEquity: 0,
                renterInvestmentBalance: 0,
                buyerCashAccount: 0,
              }]}
            />
          );
        }
        return null;
      },
    },
    {
      id: 'totalCost',
      label: 'Total Cost Comparison',
      render: (props) => {
        if (!props.totalCostData && !props.analysis) return null;
        const analysisForChart = props.totalCostData || { timeline: props.analysis?.timeline || [] };
        return <TotalCostChart analysis={analysisForChart} />;
      },
    },
    {
      id: 'equity',
      label: 'Equity Buildup',
      render: (props) => {
        const chartTimeline = props.timeline || props.analysis?.timeline || [];
        if (chartTimeline.length === 0) return null;
        return <EquityBuildupChart timeline={chartTimeline} />;
      },
    },
    {
      id: 'rentGrowth',
      label: 'Rent Growth vs Mortgage',
      render: (props) => {
        const chartTimeline = props.timeline || props.analysis?.timeline || [];
        if (chartTimeline.length === 0) return null;
        return <RentGrowthChart timeline={chartTimeline} />;
      },
    },
    {
      id: 'breakEven',
      label: 'Break-Even Timeline',
      render: (props) => {
        if (!props.analysis) return null;
        return (
          <div className="chart-wrapper">
            <BreakEvenChart analysis={props.analysis} />
          </div>
        );
      },
    },
    {
      id: 'cashFlow',
      label: 'Cash Flow Timeline',
      render: (props) => {
        // Cash flow needs specific data structure - try to derive from timeline
        const chartTimeline = props.timeline || props.analysis?.timeline || [];
        if (chartTimeline.length === 0) return null;
        const cashFlowData: CashFlowPoint[] = chartTimeline.map((point, idx) => ({
          month: idx + 1,
          homeownerCashFlow: point.buyMonthlyOutflow || 0,
          renterCashFlow: point.rentMonthlyOutflow || 0,
        }));
        if (cashFlowData.length === 0) return null;
        return <CashFlowChart data={cashFlowData} />;
      },
    },
    {
      id: 'cumulativeCost',
      label: 'Cumulative Cost Comparison',
      render: (props) => {
        const chartTimeline = props.timeline || props.analysis?.timeline || [];
        if (chartTimeline.length === 0) return null;
        const cumulativeData: CumulativeCostPoint[] = chartTimeline.map((point, idx) => ({
          month: idx + 1,
          cumulativeBuying: point.totalCostBuyToDate || 0,
          cumulativeRenting: point.totalCostRentToDate || 0,
        }));
        if (cumulativeData.length === 0) return null;
        return <CumulativeCostChart data={cumulativeData} />;
      },
    },
    {
      id: 'taxSavings',
      label: 'Tax Savings Timeline',
      render: (props) => {
        const chartTimeline = props.timeline || props.analysis?.timeline || [];
        if (chartTimeline.length === 0) return null;
        // Tax savings would need specific calculation - for now use placeholder data
        const taxData: TaxSavingsPoint[] = chartTimeline
          .filter((_, idx) => idx % 12 === 0 || idx === chartTimeline.length - 1)
          .map((point, idx) => ({
            year: point.year || Math.ceil((idx * 12 + 1) / 12),
            deductibleMortgageInterest: 0, // Would need actual tax calculation
            deductiblePropertyTax: 0, // Would need actual tax calculation
            totalTaxBenefit: 0, // Would need actual tax calculation
          }));
        if (taxData.length === 0) return null;
        return <TaxSavingsChart data={taxData} />;
      },
    },
    {
      id: 'monteCarlo',
      label: 'Monte Carlo Simulation',
      render: (props) => {
        if (!props.monteCarloData) return null;
        return (
          <div className="chart-wrapper">
            <MonteCarloChart monteCarloHomePrices={props.monteCarloData} />
          </div>
        );
      },
    },
    {
      id: 'sensitivity',
      label: 'Sensitivity Analysis',
      render: (props) => {
        if (!props.sensitivityData || props.sensitivityData.length === 0) return null;
        return <SensitivityChart results={props.sensitivityData} />;
      },
    },
    {
      id: 'breakEvenHeatmap',
      label: 'Break-Even Heatmap',
      render: (props) => {
        if (!props.heatmapData || props.heatmapData.length === 0) return null;
        return (
          <div className="chart-wrapper">
            <BreakEvenHeatmap points={props.heatmapData} />
          </div>
        );
      },
    },
    {
      id: 'scenarioOverlay',
      label: 'Scenario Overlay',
      render: (props) => {
        if (!props.scenarioOverlayData || props.scenarioOverlayData.length === 0) return null;
        return (
          <div className="chart-wrapper">
            <ScenarioOverlayChart scenarios={props.scenarioOverlayData} />
          </div>
        );
      },
    },
  ];

  function renderChartForId(id: string): React.ReactNode {
    const cfg = previewConfigs.find((c) => c.id === id);
    if (!cfg) return null;
    return cfg.render({
      analysis,
      timeline,
      totalCostData,
      monthlyCosts,
      heatmapData,
      monteCarloData,
      sensitivityData,
      scenarioOverlayData,
    });
  }

  const handleGeneratePreviews = async () => {
    if (!analysis) return;

    setIsGenerating(true);
    const results: { id: string; label: string; dataUrl: string }[] = [];

    for (const cfg of previewConfigs) {
      // Skip charts that can't render
      const canRender = cfg.render({
        analysis,
        timeline,
        totalCostData,
        monthlyCosts,
        heatmapData,
        monteCarloData,
        sensitivityData,
        scenarioOverlayData,
      });
      if (!canRender) {
        console.log(`[ExportPreviewLab] Skipping ${cfg.id} - no data available`);
        continue;
      }

      setCurrentChartId(cfg.id);

      // Wait for React to render the chart
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(() => resolve(), 200);
        });
      });

      const node = exportRef.current;
      if (!node) {
        console.warn(`[ExportPreviewLab] Export container not found for ${cfg.id}`);
        continue;
      }

      try {
        const canvas = await captureElementToCanvas(node);
        const dataUrl = canvas.toDataURL('image/png');
        results.push({ id: cfg.id, label: cfg.label, dataUrl });
        console.log(`[ExportPreviewLab] Generated preview for ${cfg.id}`);
      } catch (err) {
        console.error(`[ExportPreviewLab] Error generating preview for ${cfg.id}:`, err);
      }
    }

    setPreviews(results);
    setCurrentChartId(null);
    setIsGenerating(false);
  };

  if (!analysis) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        <h2 style={{ marginBottom: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>Export Preview Lab (Dev only)</h2>
        <p>Run an analysis in the main chat first, then come back here to preview chart exports.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>
      <h2 style={{ marginBottom: '8px' }}>Export Preview Lab (Dev only)</h2>
      <p style={{ marginBottom: '24px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
        This shows how each chart will look when exported on a white background.
      </p>

      <button
        onClick={handleGeneratePreviews}
        disabled={isGenerating}
        style={{
          padding: '12px 24px',
          background: isGenerating ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          marginBottom: '24px',
        }}
      >
        {isGenerating ? 'Generating Previews...' : 'Generate All Previews'}
      </button>

      {/* Hidden export container */}
      <div
        ref={exportRef}
        data-export-container
        style={{
          position: 'fixed',
          left: '-2000px',
          top: '-2000px',
          width: '1200px',
          padding: '24px',
          background: '#ffffff',
          borderRadius: '16px',
          opacity: 1,
          filter: 'none',
          zIndex: -9999,
        }}
      >
        {currentChartId && renderChartForId(currentChartId)}
      </div>

      {/* Preview grid */}
      {previews.length === 0 ? (
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>No previews yet. Click 'Generate All Previews'.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px',
          }}
        >
          {previews.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'rgba(30, 30, 40, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
                {p.label}
              </h3>
              <img
                src={p.dataUrl}
                alt={p.label}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

