// MINIMAL VERSION - Layout test only
// This will be replaced with full SummaryTab after layout approval

import './SummaryTab.minimal.css';

interface SummaryTabProps {
  analysis: any | null;
  zipCode?: string | null;
}

export function SummaryTab({ analysis, zipCode }: SummaryTabProps) {
  return (
    <div className="summary-tab-minimal">
      <div className="summary-content-box" style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '24px',
        background: 'rgba(30, 30, 40, 0.9)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        boxSizing: 'border-box'
      }}>
        <h2>Summary Tab - Layout Test</h2>
        <p>This is a minimal version to test the layout.</p>
        <p>Once you approve the centering and sizing, all features will be restored.</p>
        <div style={{ 
          width: '100%', 
          height: '400px', 
          background: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <p>Content Area - Should be centered like Chat & Setup tab</p>
        </div>
      </div>
    </div>
  );
}

