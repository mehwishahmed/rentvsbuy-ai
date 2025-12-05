import './ScenarioOverlayChart.css';
import type { ScenarioInputs, ScenarioResult } from '../../types/calculator';

interface ScenarioOverlayChartProps {
  scenarios: ScenarioResult[];
  isExport?: boolean;
}

export function ScenarioOverlayChart({ scenarios, isExport }: ScenarioOverlayChartProps) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-placeholder">No scenario comparison data available.</div>
      </div>
    );
  }

  const cards = scenarios
    .map((scenario, index) => {
      const inputs = scenario?.scenario as ScenarioInputs | undefined;
      const output = scenario?.output;

      if (!inputs || !output) {
        return null;
      }

      const years = inputs.timeHorizonYears ?? 0;
      const netWorthBuy = output.totals?.buyerFinalNetWorth ?? 0;
      const netWorthRent = output.totals?.renterFinalNetWorth ?? 0;
      const netDiff = netWorthBuy - netWorthRent;
      const totalBuy = output.totals?.totalBuyingCosts ?? 0;
      const totalRent = output.totals?.totalRentingCosts ?? 0;
      const totalDiff = totalBuy - totalRent;
      const best = netDiff >= 0 ? 'Buying' : 'Renting';

      return {
        id: `${inputs.homePrice}-${inputs.monthlyRent ?? 0}-${index}`,
        title: `Scenario ${index + 1}`,
        homePrice: inputs.homePrice,
        rent: inputs.monthlyRent ?? 0,
        downPayment: inputs.downPaymentPercent ?? 0,
        timeline: years,
        netDiff,
        totalDiff,
        best,
        netWorthBuy,
        netWorthRent,
        totalBuy,
        totalRent,
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  if (cards.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-placeholder">Unable to display scenarios.</div>
      </div>
    );
  }

  const sortedCards = [...cards].sort((a, b) => b.netDiff - a.netDiff);

  return (
    <div className="chart-container">
      <h3 className="chart-title">Scenario Overlay</h3>
      <p className="chart-caption">
        Compare multiple scenarios side-by-side to see which strategy builds more wealth over your timeline.
      </p>

      <div className="scenario-overlay-scroll">
        <div className="scenario-grid">
        {sortedCards.map((card, idx) => {
          const isWinner = idx === 0;
          const badge = isWinner ? 'Best Outcome' : card.netDiff >= 0 ? 'Buying wins' : 'Renting wins';

          return (
            <div key={card.id} className={`scenario-card ${isWinner ? 'is-best' : ''}`}>
              {isWinner && <div className="scenario-badge">Top Scenario</div>}
              <div className="scenario-header">
                <h4>{card.title}</h4>
                <div className={`scenario-outcome ${card.netDiff >= 0 ? 'positive' : 'negative'}`}>
                  {badge}: <strong>${Math.abs(card.netDiff).toLocaleString()}</strong>
                </div>
              </div>

              <div className="scenario-details">
                <div>
                  <span>Home Price</span>
                  <strong>${card.homePrice.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Rent</span>
                  <strong>${card.rent.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Down Payment</span>
                  <strong>{card.downPayment}%</strong>
                </div>
                <div>
                  <span>Timeline</span>
                  <strong>{card.timeline} yrs</strong>
                </div>
              </div>

              <div className="scenario-metrics">
                <div>
                  <span>Net Worth (Buy)</span>
                  <strong>${card.netWorthBuy.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Net Worth (Rent)</span>
                  <strong>${card.netWorthRent.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Total Cost (Buy)</span>
                  <strong>${card.totalBuy.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Total Cost (Rent)</span>
                  <strong>${card.totalRent.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

