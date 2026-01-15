// src/components/onboarding/OnboardingTour.tsx

import { useEffect, useMemo, useState } from 'react';

interface OnboardingTourProps {
  activeTab: 'chat' | 'charts' | 'summary';
}

export function OnboardingTour({ activeTab }: OnboardingTourProps) {
  const [open, setOpen] = useState(false);

  const message = useMemo(() => {
    if (activeTab === 'charts') {
      return 'Charts Dashboard shows all your visuals. Click any chart to view it larger, ask AI questions, and export as PDF.';
    }

    if (activeTab === 'summary') {
      return 'Summary shows your key takeaways. Once you run an analysis, your chart + metrics will appear here.';
    }

    return 'Start here! Type your ZIP code or city. I\'ll guide you through collecting your details, then you can explore your results in the Summary and Charts tabs!';
  }, [activeTab]);

  const handleReplay = () => {
    setOpen(false);
    setTimeout(() => setOpen(true), 50);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.classList.add('tour-active');
    } else {
      document.body.classList.remove('tour-active');
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={handleReplay}
        data-tour-id="tour-trigger"
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
        }}
      >
        Help
      </button>

      {open && (
        <div className="simple-tour-overlay" onClick={() => setOpen(false)}>
          <div className="simple-tour-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="simple-tour-close"
              onClick={() => setOpen(false)}
              aria-label="Close help"
            >
              ×
            </button>
            <p className="simple-tour-text">{message}</p>
            <div className="simple-tour-actions">
              <button
                type="button"
                className="simple-tour-done"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
