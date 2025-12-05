import type { AnalysisResponse, ScenarioInputs, BreakEvenHeatmapPoint, MonteCarloResponse, SensitivityRequest, SensitivityResult, ScenarioRequest, ScenarioResult } from '../../types/calculator';
import { apiFetch, API_BASE_URL } from './client';

export function analyzeScenario(
  inputs: ScenarioInputs,
  includeTimeline = false,
  zipCode?: string,
  includeMonteCarlo = false,
  monteCarloRuns?: number
): Promise<AnalysisResponse> {
  // Very long timeout for analyze endpoint (180 seconds) - ML predictions and timeline calculations can take time
  // ML model loading (first time) + predictions + 120 months of calculations = can take 60-120 seconds
  return apiFetch<AnalysisResponse>('/api/finance/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs, includeTimeline, zipCode, includeMonteCarlo, monteCarloRuns })
  }, 180000); // 180 second timeout (3 minutes) - ML + timeline calculations are computationally intensive
}

export function fetchBreakEvenHeatmap(params: HeatmapParams): Promise<BreakEvenHeatmapPoint[]> {
  // Heatmap can take longer - 120 seconds timeout
  return apiFetch<BreakEvenHeatmapPoint[]>('/api/finance/heatmap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  }, 120000); // 120 second timeout
}

export function fetchMonteCarlo(inputs: ScenarioInputs, runs = 500): Promise<MonteCarloResponse> {
  return apiFetch<MonteCarloResponse>('/api/finance/monte-carlo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs, runs })
  });
}

export function fetchSensitivity(request: SensitivityRequest): Promise<SensitivityResult[]> {
  // Sensitivity analysis can take longer - 120 seconds timeout
  return apiFetch<SensitivityResult[]>('/api/finance/sensitivity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }, 120000); // 120 second timeout
}

export function fetchScenarios(request: ScenarioRequest): Promise<ScenarioResult[]> {
  // Scenario overlay can take longer - 120 seconds timeout
  return apiFetch<ScenarioResult[]>('/api/finance/scenarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }, 120000); // 120 second timeout
}

export interface ChartInsightPayload {
  chartName: string;
  chartData: unknown;
  question: string;
  conversation?: Array<{ question: string; answer: string }>;
}

export interface ChartInsightResponse {
  answer: string;
}

export function fetchChartInsight(payload: ChartInsightPayload): Promise<ChartInsightResponse> {
  return apiFetch<ChartInsightResponse>('/api/finance/chart-insight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function fetchChartInsightStream(
  payload: ChartInsightPayload,
  onChunk: (chunk: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  const controller = new AbortController();
  
  fetch(`${API_BASE_URL}/api/finance/chart-insight`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                onChunk(parsed.chunk);
              } else if (parsed.error) {
                onError?.(new Error(parsed.error));
                return;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      onComplete?.();
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        console.error('[Chart Insight] Error:', error);
        onError?.(error instanceof Error ? error : new Error(error?.message || 'Failed to fetch insight'));
      }
    });
  
  return () => controller.abort();
}

export interface HeatmapParams {
  base: ScenarioInputs;
  timelines: number[];
  downPayments: number[];
}

export interface SummaryInsightRequest {
  zipCode?: string;
  timelineYears: number;
  buyNetWorth: number[];
  rentNetWorth: number[];
  breakEvenYear?: number;
  finalDelta: number;
  homeAppreciationRate: number;
  rentGrowthRate: number;
}

export interface SummaryInsightResponse {
  insight: string;
}

export function generateSummaryInsight(request: SummaryInsightRequest): Promise<SummaryInsightResponse> {
  return apiFetch<SummaryInsightResponse>('/api/finance/summary-insight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
}
