// src/components/charts/BreakEvenHeatmap.tsx

import './BreakEvenHeatmap.css';
import type { BreakEvenHeatmapPoint } from '../../types/calculator';

interface BreakEvenHeatmapProps {
  points: BreakEvenHeatmapPoint[];
  isExport?: boolean;
}

export function BreakEvenHeatmap({ points, isExport }: BreakEvenHeatmapProps) {
  if (!points || points.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-placeholder">No heatmap data available.</div>
      </div>
    );
  }

  const timelines = Array.from(new Set(points.map(p => p.timelineYears))).sort((a, b) => a - b);
  const downPayments = Array.from(new Set(points.map(p => p.downPaymentPercent))).sort((a, b) => a - b);

  const pointMap = new Map<string, BreakEvenHeatmapPoint>();
  points.forEach(point => {
    pointMap.set(`${point.timelineYears}-${point.downPaymentPercent}`, point);
  });

  const validMonths = points
    .map(p => p.breakevenMonth ?? null)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  const maxMonth = validMonths.length > 0 ? Math.max(...validMonths) : 0;

  const formatValue = (month: number | null) => {
    if (!month || month <= 0) return 'Rent wins';
    if (month < 12) return `${month} mo`;
    const years = month / 12;
    if (years % 1 === 0) return `${years} yr`;
    return `${years.toFixed(1)} yr`;
  };

  const getCellStyle = (month: number | null) => {
    if (isExport) {
      // Export mode: black and white
      if (!month || month <= 0) {
        return { background: '#dddddd', color: '#000000' };
      }
      if (maxMonth === 0) {
        return { background: '#ffffff', color: '#000000' };
      }
      const ratio = month / maxMonth; // 0 -> fastest break-even, 1 -> slowest
      // Use grayscale: lighter for faster, darker for slower
      const grayValue = Math.round(255 - (ratio * 150)); // 255 (white) to 105 (dark gray)
      return {
        background: `rgb(${grayValue}, ${grayValue}, ${grayValue})`,
        color: grayValue < 180 ? '#ffffff' : '#000000',
      };
    }
    
    // Normal mode: colorful
    if (!month || month <= 0) {
      return { background: 'rgba(248, 113, 113, 0.25)', color: '#f87171' };
    }
    if (maxMonth === 0) {
      return { background: 'rgba(139, 92, 246, 0.4)' };
    }
    const ratio = month / maxMonth; // 0 -> fastest break-even, 1 -> slowest
    const hue = 150 - ratio * 120; // green to orange/red
    return {
      background: `hsla(${hue}, 70%, 45%, 0.8)`,
      color: 'white',
    };
  };

  return (
    <div className="chart-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 className="chart-title">Break-Even Heatmap</h3>
      <p className="chart-caption">
        Each cell shows how long it takes buying to beat renting for the timeline (rows) and down payment (columns).
      </p>

      <div className="heatmap-table-wrapper" style={{ flex: 1, overflow: 'auto', maxHeight: '100%' }}>
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Timeline ↓ / Down Payment →</th>
              {downPayments.map(dp => (
                <th key={dp}>{dp}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timelines.map(years => (
              <tr key={years}>
                <th>{years} yr</th>
                {downPayments.map(dp => {
                  const key = `${years}-${dp}`;
                  const point = pointMap.get(key);
                  const month = point?.breakevenMonth ?? null;
                  return (
                    <td key={key} style={getCellStyle(month)}>
                      <span>{formatValue(month)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-color legend-fast" />
          <span>Breaks even fast</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-slow" />
          <span>Breaks even late</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-never" />
          <span>Rent wins over this horizon</span>
        </div>
      </div>
    </div>
  );
}

