import React from 'react';
import type { Recommendation } from '../../types/recommendation';
import './RecommendationCard.css';

interface RecommendationCardProps {
  recommendation: Recommendation;
  location?: string; // e.g., "Poway, CA" or "San Diego"
  timeline: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  location,
  timeline
}) => {
  const { verdict, savings, monthlyDifference, breakEvenYear, reasoning } = recommendation;
  
  const verdictColor = verdict === 'RENT' ? '#10b981' : '#3b82f6'; // green for rent, blue for buy
  const verdictIcon = verdict === 'RENT' ? '🏢' : '🏠';
  
  return (
    <div className="recommendation-card">
      <div className="recommendation-intro">
        Thank you for your info! Based on your results:
      </div>
      <div className="recommendation-header">
        <span className="recommendation-icon">{verdictIcon}</span>
        <h2 className="recommendation-verdict" style={{ color: verdictColor }}>
          RECOMMENDATION: {verdict}
        </h2>
      </div>
      
      <div className="recommendation-body">
        <p className="recommendation-savings">
          {verdict === 'RENT' ? "You'll save" : "You'll gain"}{' '}
          <strong>${isNaN(savings) ? '0' : savings.toLocaleString()}</strong>{' '}
          over {timeline} years by {verdict.toLowerCase()}ing
          {location && ` in ${location}`}.
        </p>
        
        <div className="recommendation-details">
          <div className="detail-item">
            <span className="detail-label">Monthly:</span>
            <span className="detail-value">
              {isNaN(monthlyDifference) ? 'Calculating...' : monthlyDifference > 0 
                ? `Buying costs $${Math.abs(monthlyDifference).toLocaleString()} more`
                : `Renting costs $${Math.abs(monthlyDifference).toLocaleString()} more`
              }
            </span>
          </div>
          
          {breakEvenYear && (
            <div className="detail-item">
              <span className="detail-label">Break-even:</span>
              <span className="detail-value">
                Year {breakEvenYear}
                {breakEvenYear > timeline && ` (you're staying ${timeline} years)`}
              </span>
            </div>
          )}
        </div>
        
        <p className="recommendation-reasoning">{reasoning}</p>
      </div>
      
    </div>
  );
};

