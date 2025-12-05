// src/lib/charts/exportChartColors.ts

/**
 * Returns color palette for charts based on export mode.
 * When isExport=true, returns high-contrast black/white/gray colors for PDF.
 * When isExport=false or undefined, returns the normal colorful palette.
 */
export function getChartColors(isExport?: boolean) {
  if (!isExport) {
    // Normal on-screen colors (unchanged)
    return {
      background: 'transparent',
      grid: 'rgba(139, 92, 246, 0.2)',
      axis: 'rgba(255, 255, 255, 0.7)',
      text: 'rgba(255, 255, 255, 0.9)',
      line1: 'rgba(124, 95, 196, 0.65)', // Purple for buying
      line2: 'rgba(80, 140, 210, 0.6)', // Blue for renting
      line3: '#38a169', // Green for median
      line4: '#3182ce', // Blue for p90
      line5: '#e53e3e', // Red for p10
      bar1: 'rgba(124, 95, 196, 0.55)',
      bar2: 'rgba(80, 140, 210, 0.5)',
      areaFill: 'rgba(49, 130, 206, 0.3)',
      areaFillLight: 'rgba(49, 130, 206, 0.1)',
      tooltipBg: 'rgba(5, 8, 15, 0.85)',
      tooltipBorder: 'rgba(124, 95, 196, 0.35)',
      tooltipText: '#f1f5f9',
    };
  }

  // Export mode: high-contrast black/white/gray
  return {
    background: '#ffffff',
    grid: '#cccccc',
    axis: '#000000',
    text: '#000000',
    line1: '#000000', // Black for primary line
    line2: '#444444', // Dark gray for secondary line
    line3: '#000000', // Black for median
    line4: '#666666', // Medium gray for p90
    line5: '#333333', // Dark gray for p10
    bar1: '#000000',
    bar2: '#444444',
    areaFill: '#dddddd', // Light gray, fully opaque
    areaFillLight: '#eeeeee', // Lighter gray, fully opaque
    tooltipBg: '#ffffff',
    tooltipBorder: '#000000',
    tooltipText: '#000000',
  };
}

/**
 * Returns container styles for export mode.
 * Overrides dark backgrounds and white text to work on white PDF background.
 */
export function getChartContainerStyles(isExport?: boolean): React.CSSProperties {
  if (!isExport) {
    return {};
  }
  return {
    background: '#ffffff',
    color: '#000000',
  };
}

/**
 * Returns title styles for export mode.
 */
export function getChartTitleStyles(isExport?: boolean): React.CSSProperties {
  if (!isExport) {
    return {};
  }
  return {
    color: '#000000',
  };
}

/**
 * Returns caption styles for export mode.
 */
export function getChartCaptionStyles(isExport?: boolean): React.CSSProperties {
  if (!isExport) {
    return { color: 'rgba(255, 255, 255, 0.7)' };
  }
  return {
    color: '#000000',
  };
}

