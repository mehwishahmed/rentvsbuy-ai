// src/App.tsx

import { useState } from 'react';
import { ChatContainer } from './components/chat/ChatContainer';
import AuroraBackground from './components/layout/AuroraBackground';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';
import rentBuyLogo from './assets/rent-vs-buy-logo.png';

function App() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <ErrorBoundary>
      <div className="app">
        <AuroraBackground />
        <div className="title-banner">
          <div className="title-banner-left">
            <img
              src={rentBuyLogo}
              alt="Rent vs Buy"
              className="title-logo"
            />
            <p className="title-banner-tagline">Smart Housing Analysis</p>
          </div>
          <div className="title-banner-right">
            <button 
              className="banner-button"
              onClick={() => {
                // This will be handled by ChatContainer via ref or context
                const saveButton = document.querySelector('[data-tour-id="save-button"]') as HTMLButtonElement;
                if (saveButton) saveButton.click();
              }}
              title="Save current chat"
            >
              Save Chat
            </button>
            <button 
              className="banner-button"
              onClick={() => {
                const restartButton = document.querySelector('[data-tour-id="restart-button"]') as HTMLButtonElement;
                if (restartButton) restartButton.click();
              }}
              title="Start over"
            >
              Restart
            </button>
            <button 
              className="banner-button"
              onClick={() => {
                const helpButton = document.querySelector('[title="Replay the quick tutorial"]') as HTMLButtonElement;
                if (helpButton) helpButton.click();
              }}
              title="Replay the quick tutorial"
            >
              Help
            </button>
            <button 
              className="banner-button"
              onClick={() => setShowAbout(true)}
              title="About RentVsBuy.ai"
            >
              About
            </button>
          </div>
        </div>
        {showAbout && (
          <div
            className="about-modal-overlay"
            onClick={() => setShowAbout(false)}
          >
            <div
              className="about-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="about-modal-header">
                <div>
                  <div className="about-modal-label">✨ Welcome</div>
                  <h2 className="about-modal-title">About RentVsBuy.ai</h2>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="about-modal-close"
                  aria-label="Close about modal"
                >
                  ×
                </button>
              </div>
              <div className="about-modal-body">
                <p>
                  Created by Mehwish F Ahmed. RentVsBuy.ai is an AI-powered financial advisor that helps you make informed decisions about whether to buy a house or keep renting. We believe that everyone deserves access to clear, data-driven insights when making one of life's biggest financial decisions.
                </p>
                <p>
                  Our tool analyzes your specific situation, including local market data, and provides personalized comparisons through interactive charts and detailed financial projections.
                </p>
              </div>
            </div>
          </div>
        )}
        <ChatContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;