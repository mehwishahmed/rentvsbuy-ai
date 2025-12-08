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
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.2s',
        height: '160px',
        minHeight: '160px',
        maxHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
        e.currentTarget.style.borderColor = style.accentColor;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
        e.currentTarget.style.borderColor = style.borderColor;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header: Icon and Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div className="metric-icon-animated" style={{ fontSize: '28px' }}>{icon}</div>
        <div 
          style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>

      {/* Value */}
      <div 
        style={{ 
          fontSize: '24px', 
          fontWeight: 600, 
          color: 'rgba(255, 255, 255, 0.95)', 
          marginBottom: '6px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          lineHeight: '1.3',
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div 
          style={{ 
            fontSize: '13px', 
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.3',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

