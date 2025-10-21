// src/lib/location/zipCodeService.ts

import zipCodeData from '../../data/zipCodeData.json';

export interface LocationData {
  state: string;
  city: string;
  homeValue: number;
  rentValue: number;
}

export interface FormattedLocationData {
  city: string;
  state: string;
  medianHomePrice: number;
  averageRent: number;
  propertyTaxRate: number;
}

// Property tax rates by state (approximate averages)
const PROPERTY_TAX_RATES: Record<string, number> = {
  'AL': 0.4, 'AK': 1.0, 'AZ': 0.6, 'AR': 0.6, 'CA': 0.7, 'CO': 0.5,
  'CT': 1.7, 'DE': 0.5, 'FL': 0.9, 'GA': 0.9, 'HI': 0.3, 'ID': 0.7,
  'IL': 1.7, 'IN': 0.8, 'IA': 1.3, 'KS': 1.3, 'KY': 0.8, 'LA': 0.5,
  'ME': 1.1, 'MD': 1.0, 'MA': 1.1, 'MI': 1.4, 'MN': 1.1, 'MS': 0.6,
  'MO': 0.9, 'MT': 0.8, 'NE': 1.6, 'NV': 0.6, 'NH': 1.9, 'NJ': 2.0,
  'NM': 0.6, 'NY': 1.2, 'NC': 0.8, 'ND': 0.9, 'OH': 1.4, 'OK': 0.8,
  'OR': 0.9, 'PA': 1.4, 'RI': 1.4, 'SC': 0.5, 'SD': 1.2, 'TN': 0.7,
  'TX': 1.6, 'UT': 0.6, 'VT': 1.8, 'VA': 0.8, 'WA': 0.9, 'WV': 0.5,
  'WI': 1.7, 'WY': 0.6, 'DC': 0.5
};

export const getLocationData = (zipCode: string): LocationData | null => {
  return zipCodeData[zipCode] || null;
};

export const formatLocationData = (data: LocationData): FormattedLocationData => {
  return {
    city: data.city,
    state: data.state,
    medianHomePrice: data.homeValue,
    averageRent: data.rentValue,
    propertyTaxRate: PROPERTY_TAX_RATES[data.state] || 1.0
  };
};

export const detectZipCode = (message: string): string | null => {
  // Match 5-digit ZIP codes
  const zipMatch = message.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
};
