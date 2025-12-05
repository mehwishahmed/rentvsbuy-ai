// src/components/onboarding/OnboardingTour.tsx

import { useEffect, useMemo, useState } from 'react';
import Joyride, { type Step, STATUS, EVENTS, ACTIONS } from 'react-joyride';

const STORAGE_KEY_CHAT = 'rentvsbuy_has_seen_chat_tour';
const STORAGE_KEY_CHARTS = 'rentvsbuy_has_seen_charts_tour';
const STORAGE_KEY_SUMMARY = 'rentvsbuy_has_seen_summary_tour';

interface OnboardingTourProps {
  activeTab: 'chat' | 'charts' | 'summary';
}

export function OnboardingTour({ activeTab }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAbout, setShowAbout] = useState(false);

  // Chat & Setup Tab Tour Steps
  const chatSteps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour-id="phase-one-card"]',
        content: 'Phase 1 shows your local market data. Mention any ZIP or city in the chat to refresh it before we run the numbers.',
        disableBeacon: true,
        placement: 'bottom',
      },
      {
        target: '[data-tour-id="basic-inputs-card"]',
        content: 'Phase 2 captures the basics: home price, monthly rent, down payment %, and how long you plan to stay. The chat helps you fill these in.',
      },
      {
        target: '[data-tour-id="advanced-inputs-card"]',
        content: 'Phase 3 lets you fine-tune assumptions like interest rates, property taxes, and HOA dues. Most people can leave these at their defaults.',
      },
      {
        target: '[data-tour-id="analyze-button"]',
        content: 'When you\'re ready, hit Send in the chat to share your details and I\'ll run the full analysis behind the scenes.',
        placement: 'top',
      },
      {
        target: '[data-tour-id="charts-tab-button"]',
        content: 'All visuals live in the Charts Dashboard. Use this tab to see and explore your charts after we collect your info here in the chat.',
        placement: 'bottom',
      },
    ],
    []
  );

  // Charts Dashboard Tab Tour Steps
  const chartsSteps: Step[] = useMemo(
    () => [
      {
        target: '.chart-grid-item-clickable',
        content: 'Here is your Charts Dashboard! Click any chart to open it, ask AI questions, and export the chart with your insights as a PDF.',
        placement: 'top',
        disableBeacon: true,
        beforeStep: async () => {
          const chartsTab = document.querySelector('[data-tour-id="charts-tab-button"]') as HTMLElement;
          if (chartsTab && !chartsTab.classList.contains('active')) {
            chartsTab.click();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          await new Promise(resolve => setTimeout(resolve, 150));
          const firstChart = document.querySelector('.chart-grid-item-clickable') as HTMLElement;
          if (firstChart) {
            firstChart.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
      },
    ],
    []
  );

  // Summary Tab Tour Steps
  const summarySteps: Step[] = useMemo(
    () => [
      {
        target: '.hero-chart-wrapper',
        content: 'This is where you can see the chart. The Net Worth chart shows how your wealth changes over time if you buy versus continue renting.',
        disableBeacon: true,
        placement: 'top',
      },
      {
        target: '.metrics-panel',
        content: 'Here are your key metrics. These six cards show important numbers like break-even year, net worth difference, total equity, and more.',
        placement: 'top',
      },
      {
        target: '.insight-box',
        content: 'This is the insights summary section. Click "Generate Summary Insight" to get an AI-powered explanation of your scenario.',
        placement: 'top',
      },
    ],
    []
  );

  const steps = activeTab === 'chat' ? chatSteps : activeTab === 'charts' ? chartsSteps : summarySteps;

  // Auto-start tour for first-time visitors (only for chat tab)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (activeTab === 'chat') {
      const timer = setTimeout(() => {
        const hasSeenTour = localStorage.getItem(STORAGE_KEY_CHAT);
        if (!hasSeenTour) {
          localStorage.setItem(STORAGE_KEY_CHAT, 'true');
          console.log('[OnboardingTour] Auto-starting tour for first-time visitor');
          setRun(true);
        }
        setIsReady(true);
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
    }
  }, [activeTab]);

  // Log when run state changes
  useEffect(() => {
    console.log('[OnboardingTour] Tour run state changed:', { run, activeTab, stepsCount: steps.length });
  }, [run, activeTab, steps.length]);

  const handleReplay = () => {
    console.log('[OnboardingTour] Replay button clicked, starting tour');
    setRun(false);
    setTimeout(() => {
      setRun(true);
      console.log('[OnboardingTour] Tour started, run state:', true);
    }, 10);
  };

  // Manual arrow key handler - directly click Joyride buttons
  useEffect(() => {
    if (!run) return;

    const handleArrowKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

      // Check if tour is actually running
      const tooltip = document.querySelector('[class*="react-joyride__tooltip"]') as HTMLElement;
      if (!tooltip) {
        console.log('[OnboardingTour] No tooltip found, ignoring arrow key');
        return;
      }

      // Find all buttons in the tooltip
      const buttons = tooltip.querySelectorAll('button');
      console.log('[OnboardingTour] Found buttons:', buttons.length, Array.from(buttons).map(b => b.textContent));

      if (e.key === 'ArrowRight') {
        // Find the "Next" or last button (skip button is usually first)
        let nextButton: HTMLElement | null = null;
        for (const btn of Array.from(buttons)) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('next') || text.includes('→') || btn === buttons[buttons.length - 1]) {
            nextButton = btn;
            break;
          }
        }
        
        if (nextButton && !(nextButton as HTMLButtonElement).disabled) {
          console.log('[OnboardingTour] Clicking next button:', nextButton.textContent);
          e.preventDefault();
          e.stopPropagation();
          nextButton.click();
        } else {
          console.log('[OnboardingTour] Next button not found or disabled');
        }
      } else if (e.key === 'ArrowLeft') {
        // Find the "Back" or "Previous" button
        let backButton: HTMLElement | null = null;
        for (const btn of Array.from(buttons)) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('back') || text.includes('previous') || text.includes('←')) {
            backButton = btn;
            break;
          }
        }
        
        if (backButton) {
          console.log('[OnboardingTour] Clicking back button:', backButton.textContent);
          e.preventDefault();
          e.stopPropagation();
          backButton.click();
        } else {
          console.log('[OnboardingTour] Back button not found');
        }
      }
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleArrowKey, true);
    return () => {
      document.removeEventListener('keydown', handleArrowKey, true);
    };
  }, [run]);

  return (
    <>
      <button
        type="button"
        onClick={handleReplay}
        title="Replay the quick tutorial"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10003,
          padding: '10px 18px',
          borderRadius: '999px',
          border: 'none',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        }}
      >
        Help
      </button>
      <button
        type="button"
        onClick={() => setShowAbout(true)}
        title="About RentVsBuy.ai"
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 10003,
          padding: '10px 18px',
          borderRadius: '999px',
          border: 'none',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        }}
      >
        About
      </button>

      {showAbout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 15, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10004,
            padding: '24px',
          }}
          onClick={() => setShowAbout(false)}
        >
          <div
            style={{
              width: 'min(800px, 90vw)',
              maxHeight: '90vh',
              background: 'rgba(6, 10, 18, 0.98)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '24px',
              boxShadow: '0 30px 80px rgba(2, 6, 23, 0.7)',
              padding: '32px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(148, 163, 184, 0.8)', marginBottom: '8px' }}>
                  ✨ Welcome
                </div>
                <h2 style={{ margin: 0, fontSize: '28px', color: 'rgba(248, 250, 252, 0.95)', fontWeight: 700 }}>
                  About RentVsBuy.ai
                </h2>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(248, 250, 252, 0.8)',
                  fontSize: '32px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.color = 'rgba(248, 250, 252, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(248, 250, 252, 0.8)';
                }}
                aria-label="Close about modal"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'rgba(248, 250, 252, 0.85)', lineHeight: '1.7' }}>
              {/* Creator */}
              <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <p style={{ margin: 0, fontSize: '16px', color: 'rgba(248, 250, 252, 0.9)' }}>
                  Created by <span style={{ fontWeight: 600, color: 'rgba(248, 250, 252, 0.95)' }}>Mehwish Ahmed</span>
                </p>
              </div>

              {/* Our Mission */}
              <div>
                <h3 style={{ fontSize: '20px', color: 'rgba(248, 250, 252, 0.95)', marginBottom: '12px', fontWeight: 600 }}>
                  Our Mission
                </h3>
                <p style={{ margin: 0, fontSize: '15px' }}>
                  RentVsBuy.ai is an AI-powered financial advisor that helps you make informed decisions about whether to buy a house or keep renting. We believe that everyone deserves access to clear, data-driven insights when making one of life's biggest financial decisions.
                </p>
                <p style={{ margin: '12px 0 0', fontSize: '15px' }}>
                  Unlike traditional calculators, we use AI to have natural conversations with you, understand your unique financial situation, and generate visual comparisons tailored to your specific scenario. Our goal is to make complex financial analysis accessible, understandable, and actionable.
                </p>
              </div>

              {/* What We Do */}
              <div>
                <h3 style={{ fontSize: '20px', color: 'rgba(248, 250, 252, 0.95)', marginBottom: '12px', fontWeight: 600 }}>
                  What We Do
                </h3>
                <p style={{ margin: 0, fontSize: '15px' }}>
                  We analyze your housing situation and provide comprehensive comparisons between buying a home and continuing to rent. Our platform generates interactive charts, personalized recommendations, and detailed financial breakdowns—all through a friendly, conversational interface.
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h3 style={{ fontSize: '20px', color: 'rgba(248, 250, 252, 0.95)', marginBottom: '12px', fontWeight: 600 }}>
                  Key Features
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '15px' }}>
                  <li style={{ marginBottom: '8px' }}>💬 Natural language AI conversations powered by OpenAI GPT-4</li>
                  <li style={{ marginBottom: '8px' }}>📊 Interactive financial charts and visualizations</li>
                  <li style={{ marginBottom: '8px' }}>📍 Location-based data for 26,000+ ZIP codes</li>
                  <li style={{ marginBottom: '8px' }}>🎯 Personalized "Buy" or "Rent" recommendations</li>
                  <li style={{ marginBottom: '8px' }}>💾 Professional PDF export for sharing</li>
                  <li style={{ marginBottom: '8px' }}>⏰ Custom timeline analysis (3, 5, 10+ years)</li>
                </ul>
              </div>

              {/* Tech Stack */}
              <div>
                <h3 style={{ fontSize: '20px', color: 'rgba(248, 250, 252, 0.95)', marginBottom: '12px', fontWeight: 600 }}>
                  Built With
                </h3>
                <p style={{ margin: 0, fontSize: '15px' }}>
                  React 18 + TypeScript, OpenAI GPT-4o-mini, Recharts, FastAPI, and modern web technologies. All calculations use industry-standard financial formulas and have been audited for accuracy.
                </p>
              </div>

              {/* Disclaimer */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(148, 163, 184, 0.8)', fontStyle: 'italic' }}>
                  ⚠️ This tool provides educational estimates and should not be considered financial advice. Consult with a qualified financial advisor before making major financial decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReady && (
        <Joyride
          steps={steps}
          run={run}
          continuous
          showSkipButton
          showProgress
          disableScrolling={false}
          scrollToFirstStep
          scrollOffset={40}
          spotlightClicks={false}
          disableCloseOnEsc={false}
          styles={{
            options: {
              zIndex: 10002,
              primaryColor: '#8b5cf6',
            },
            spotlight: {
              borderRadius: '14px',
              backgroundColor: 'rgba(0,0,0,0.3)',
            },
            overlay: {
              backgroundColor: 'rgba(2,6,23,0.55)',
            },
            tooltip: {
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(99,102,241,0.35)',
              padding: '20px',
              color: '#f8fafc',
            },
            buttonNext: {
              borderRadius: '999px',
              padding: '8px 18px',
              fontWeight: 600,
            },
            buttonBack: {
              color: 'rgba(148,163,184,0.9)',
              fontWeight: 500,
            },
          }}
          callback={(data) => {
            const { status, action, type, index } = data;
            const stepIndex = index ?? 0;

            // Log all callback events to debug arrow key navigation
            if (action === ACTIONS.NEXT || action === ACTIONS.PREV) {
              console.log(`[Joyride Callback] Navigation action: ${action}`, {
                stepIndex,
                type,
                status,
                action,
                message: action === ACTIONS.NEXT ? 'Moving to next step' : 'Moving to previous step'
              });
            }

            if (type === EVENTS.STEP_AFTER || type === EVENTS.STEP_BEFORE) {
              setCurrentStepIndex(stepIndex);
              console.log(`[Joyride Callback] Step ${type}:`, {
                stepIndex,
                totalSteps: steps.length,
                action
              });
            }

            if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
              console.log(`[Joyride Callback] Tour ${status}`, { stepIndex, action });
              const storageKey = activeTab === 'chat' ? STORAGE_KEY_CHAT : activeTab === 'charts' ? STORAGE_KEY_CHARTS : STORAGE_KEY_SUMMARY;
              localStorage.setItem(storageKey, 'true');
              setRun(false);
              setCurrentStepIndex(0);
              // Close any open chart insight modals
              if (activeTab === 'charts') {
                const closeButton = document.querySelector('.chart-insight-close') as HTMLElement;
                if (closeButton) {
                  closeButton.click();
                }
              }
            }

            if (action === ACTIONS.CLOSE) {
              console.log('[Joyride Callback] Tour closed by user', { stepIndex });
              setRun(false);
              setCurrentStepIndex(0);
              // Close any open chart insight modals
              if (activeTab === 'charts') {
                const closeButton = document.querySelector('.chart-insight-close') as HTMLElement;
                if (closeButton) {
                  closeButton.click();
                }
              }
            }
          }}
        />
      )}
    </>
  );
}

