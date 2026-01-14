// src/components/summary/KeyMetricCard.tsx

interface KeyMetricCardProps {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  variant?: 'positive' | 'negative' | 'neutral';
}

export function KeyMetricCard({
  icon,
  label,
  value,
  subtitle,
  variant = 'neutral',
}: KeyMetricCardProps) {
  // Variant styling
  const variantStyles = {
    positive: {
      borderColor: 'rgba(16, 185, 129, 0.3)',
      accentColor: 'rgba(16, 185, 129, 0.5)',
    },
    negative: {
      borderColor: 'rgba(239, 68, 68, 0.3)',
      accentColor: 'rgba(239, 68, 68, 0.5)',
    },
    neutral: {
      borderColor: 'rgba(139, 92, 246, 0.2)',
      accentColor: 'rgba(139, 92, 246, 0.3)',
    },
  };

  const style = variantStyles[variant];

  return (
    <div 
      className="key-metric-card"
      style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: `1px solid ${style.borderColor}`,
        borderRadius: '6px',
        padding: '8px',
        transition: 'all 0.2s',
        height: '60px',
        minHeight: '60px',
        maxHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
        e.currentTarget.style.borderColor = style.accentColor;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
        e.currentTarget.style.borderColor = style.borderColor;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header: Icon and Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
        <div className="metric-icon-animated" style={{ fontSize: '14px' }}>{icon}</div>
        <div 
          style={{ 
            fontSize: '8px', 
            color: 'rgba(255, 255, 255, 0.6)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3px',
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>

      {/* Value */}
      <div 
        style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: 'rgba(255, 255, 255, 0.95)', 
          marginBottom: '2px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          lineHeight: '1.2',
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div 
          style={{ 
            fontSize: '8px', 
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.2',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

