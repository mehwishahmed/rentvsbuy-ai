import React from 'react';

export interface AdvancedInputValues {
  loanTermYears: number;
  interestRate: number;
  propertyTaxRate: number;
  maintenanceRate: number;
  homeInsuranceAnnual: number;
  renterInsuranceAnnual: number;
  hoaMonthly: number;
}

interface AdvancedInputsCardProps {
  values: AdvancedInputValues;
  editingValues: AdvancedInputValues;
  isEditMode: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onFieldChange: (field: keyof AdvancedInputValues, value: number) => void;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(12, 16, 27, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '20px',
};

const phaseLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.55)',
};

const fieldGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '12px',
  minWidth: 'max-content',
};

const expandedScrollStyle: React.CSSProperties = {
  marginTop: '16px',
  maxWidth: '100%',
  overflowX: 'auto',
  overflowY: 'visible',
  paddingBottom: '6px',
  paddingRight: '6px',
};

const fieldCardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.02)',
  minWidth: '220px',
  flexShrink: 0,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
  marginBottom: '6px',
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.95)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.05)',
  color: 'white',
  padding: '8px 10px',
};

export function AdvancedInputsCard({
  values,
  editingValues,
  isEditMode,
  isExpanded,
  onToggle,
  onFieldChange,
}: AdvancedInputsCardProps) {
  const displayValue = (field: keyof AdvancedInputValues) => {
    const value = values[field];
    switch (field) {
      case 'interestRate':
      case 'maintenanceRate':
      case 'propertyTaxRate':
        return `${value.toFixed(2)}%`;
      case 'loanTermYears':
        return `${value} yrs`;
      case 'homeInsuranceAnnual':
      case 'renterInsuranceAnnual':
        return `$${value.toLocaleString()}/yr`;
      case 'hoaMonthly':
        return `$${value.toLocaleString()}/mo`;
      default:
        return value;
    }
  };

  const handleInput = (field: keyof AdvancedInputValues, raw: string) => {
    if (raw.trim() === '') {
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      onFieldChange(field, parsed);
    }
  };

  const renderInput = (field: keyof AdvancedInputValues, step = 0.1) => (
    <input
      type="number"
      step={step}
      style={inputStyle}
      value={editingValues[field]}
      onChange={(e) => handleInput(field, e.target.value)}
    />
  );

  return (
    <section style={cardStyle} data-tour-id="advanced-inputs-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={phaseLabelStyle}>Phase 3 · Advanced assumptions</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: 'rgba(255,255,255,0.92)' }}>
            Fine-tune the scenario
          </h3>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '999px',
            color: 'white',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
        These defaults come from the ZIP you selected and national averages. Adjust them only if you know you should.
      </p>

      {isExpanded ? (
        <div style={expandedScrollStyle}>
          <div style={fieldGridStyle}>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>Loan term (years)</div>
            {isEditMode ? renderInput('loanTermYears', 1) : <div style={fieldValueStyle}>{displayValue('loanTermYears')}</div>}
          </div>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>Mortgage rate</div>
            {isEditMode ? renderInput('interestRate', 0.1) : <div style={fieldValueStyle}>{displayValue('interestRate')}</div>}
          </div>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>Property tax rate</div>
            {isEditMode ? renderInput('propertyTaxRate', 0.1) : <div style={fieldValueStyle}>{displayValue('propertyTaxRate')}</div>}
          </div>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>Maintenance rate</div>
            {isEditMode ? renderInput('maintenanceRate', 0.1) : <div style={fieldValueStyle}>{displayValue('maintenanceRate')}</div>}
          </div>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>Home insurance</div>
            {isEditMode ? renderInput('homeInsuranceAnnual', 100) : <div style={fieldValueStyle}>{displayValue('homeInsuranceAnnual')}</div>}
          </div>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>Renter insurance</div>
            {isEditMode ? renderInput('renterInsuranceAnnual', 50) : <div style={fieldValueStyle}>{displayValue('renterInsuranceAnnual')}</div>}
          </div>
          <div style={fieldCardStyle}>
            <div style={fieldLabelStyle}>HOA dues</div>
            {isEditMode ? renderInput('hoaMonthly', 10) : <div style={fieldValueStyle}>{displayValue('hoaMonthly')}</div>}
          </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={fieldLabelStyle}>Mortgage rate</div>
            <div style={fieldValueStyle}>{displayValue('interestRate')}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>Loan term</div>
            <div style={fieldValueStyle}>{displayValue('loanTermYears')}</div>
          </div>
          <div>
            <div style={fieldLabelStyle}>Property tax</div>
            <div style={fieldValueStyle}>{displayValue('propertyTaxRate')}</div>
          </div>
        </div>
      )}
    </section>
  );
}

