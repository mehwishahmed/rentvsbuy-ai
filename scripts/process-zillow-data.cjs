const fs = require('fs');
const path = require('path');

// File paths
const ZHVI_PATH = '/Users/mehwishahmed/Desktop/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const ZORI_PATH = '/Users/mehwishahmed/Desktop/Zip_zori_uc_sfrcondomfr_sm_month.csv';
const OUTPUT_PATH = path.join(__dirname, '../src/data/zipCodeData.json');

// State-level property tax rates (as decimal, e.g., 1.2% = 0.012)
const PROPERTY_TAX_BY_STATE = {
  'AL': 0.0041, 'AK': 0.0119, 'AZ': 0.0062, 'AR': 0.0061, 'CA': 0.0073,
  'CO': 0.0051, 'CT': 0.0211, 'DE': 0.0057, 'FL': 0.0098, 'GA': 0.0092,
  'HI': 0.0028, 'ID': 0.0063, 'IL': 0.0215, 'IN': 0.0085, 'IA': 0.0154,
  'KS': 0.0141, 'KY': 0.0086, 'LA': 0.0055, 'ME': 0.0138, 'MD': 0.0109,
  'MA': 0.0124, 'MI': 0.0154, 'MN': 0.0111, 'MS': 0.0081, 'MO': 0.0097,
  'MT': 0.0084, 'NE': 0.0176, 'NV': 0.0060, 'NH': 0.0218, 'NJ': 0.0247,
  'NM': 0.0079, 'NY': 0.0172, 'NC': 0.0084, 'ND': 0.0098, 'OH': 0.0157,
  'OK': 0.0090, 'OR': 0.0097, 'PA': 0.0154, 'RI': 0.0168, 'SC': 0.0057,
  'SD': 0.0128, 'TN': 0.0071, 'TX': 0.0180, 'UT': 0.0060, 'VT': 0.0188,
  'VA': 0.0082, 'WA': 0.0092, 'WV': 0.0059, 'WI': 0.0176, 'WY': 0.0061,
  'DC': 0.0056
};

console.log('🚀 Starting Enhanced Zillow data processing...\n');

// Function to calculate annual growth rate
function calculateAnnualGrowthRate(oldValue, newValue, years) {
  if (!oldValue || !newValue || oldValue <= 0 || newValue <= 0) {
    return null;
  }
  // Formula: ((newValue / oldValue) ^ (1/years) - 1) * 100
  const rate = (Math.pow(newValue / oldValue, 1 / years) - 1) * 100;
  return Math.round(rate * 100) / 100; // Round to 2 decimals
}

// Function to parse CSV and extract latest + historical values
function parseCSV(filePath, valueType) {
  console.log(`📂 Reading ${valueType} file...`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  
  if (lines.length < 2) {
    throw new Error(`Invalid CSV file: ${filePath}`);
  }
  
  // Get headers
  const headers = lines[0].split(',');
  console.log(`   Found ${headers.length} columns`);
  
  // Find date columns
  const dateColumns = headers.filter(h => h.match(/\d{4}-\d{2}-\d{2}/));
  const latestDateColumn = dateColumns[dateColumns.length - 1];
  
  // Find column 60 months ago (5 years)
  const historicalDateColumn = dateColumns.length >= 60 ? dateColumns[dateColumns.length - 60] : null;
  
  console.log(`   Latest data: ${latestDateColumn}`);
  if (historicalDateColumn) {
    console.log(`   Historical data (5 years ago): ${historicalDateColumn}`);
  } else {
    console.log(`   ⚠️  Not enough historical data for growth rate calculation`);
  }
  
  // Find column indices
  const regionNameIndex = headers.indexOf('RegionName');
  const stateIndex = headers.indexOf('StateName');
  const cityIndex = headers.indexOf('City');
  const latestValueIndex = headers.indexOf(latestDateColumn);
  const historicalValueIndex = historicalDateColumn ? headers.indexOf(historicalDateColumn) : -1;
  
  if (regionNameIndex === -1 || latestValueIndex === -1) {
    throw new Error('Required columns not found');
  }
  
  // Parse data
  const data = {};
  let processedCount = 0;
  let skippedCount = 0;
  let growthRateCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const zipCode = values[regionNameIndex];
    const state = values[stateIndex] || '';
    const city = values[cityIndex] || '';
    const latestValue = parseFloat(values[latestValueIndex]);
    const historicalValue = historicalValueIndex !== -1 ? parseFloat(values[historicalValueIndex]) : null;
    
    // Skip if no valid value
    if (!zipCode || isNaN(latestValue)) {
      skippedCount++;
      continue;
    }
    
    // Calculate growth rate if we have historical data
    let growthRate = null;
    if (historicalValue && !isNaN(historicalValue)) {
      growthRate = calculateAnnualGrowthRate(historicalValue, latestValue, 5);
      if (growthRate !== null) {
        growthRateCount++;
      }
    }
    
    data[zipCode] = {
      state,
      city,
      [valueType]: Math.round(latestValue),
      [`${valueType}GrowthRate`]: growthRate
    };
    processedCount++;
  }
  
  console.log(`   ✅ Processed ${processedCount} ZIP codes`);
  console.log(`   📈 Calculated growth rates for ${growthRateCount} ZIP codes`);
  console.log(`   ⚠️  Skipped ${skippedCount} invalid entries\n`);
  
  return data;
}

// Process both files
try {
  console.log('📊 Processing home values (ZHVI)...');
  const homeData = parseCSV(ZHVI_PATH, 'homeValue');
  
  console.log('📊 Processing rent values (ZORI)...');
  const rentData = parseCSV(ZORI_PATH, 'rentValue');
  
  // Merge the data
  console.log('🔄 Merging datasets and adding property tax rates...');
  const mergedData = {};
  
  // Start with home data
  Object.keys(homeData).forEach(zip => {
    mergedData[zip] = { ...homeData[zip] };
    
    // Add property tax rate based on state
    const state = homeData[zip].state;
    if (state && PROPERTY_TAX_BY_STATE[state]) {
      mergedData[zip].propertyTaxRate = PROPERTY_TAX_BY_STATE[state];
    }
  });
  
  // Add rent data
  Object.keys(rentData).forEach(zip => {
    if (mergedData[zip]) {
      mergedData[zip].rentValue = rentData[zip].rentValue;
      mergedData[zip].rentValueGrowthRate = rentData[zip].rentValueGrowthRate;
    } else {
      mergedData[zip] = { ...rentData[zip] };
      // Add property tax rate
      const state = rentData[zip].state;
      if (state && PROPERTY_TAX_BY_STATE[state]) {
        mergedData[zip].propertyTaxRate = PROPERTY_TAX_BY_STATE[state];
      }
    }
  });
  
  // Count coverage
  const totalZips = Object.keys(mergedData).length;
  const bothValues = Object.values(mergedData).filter(d => d.homeValue && d.rentValue).length;
  const homeGrowthRates = Object.values(mergedData).filter(d => d.homeValueGrowthRate !== null).length;
  const rentGrowthRates = Object.values(mergedData).filter(d => d.rentValueGrowthRate !== null).length;
  const withPropertyTax = Object.values(mergedData).filter(d => d.propertyTaxRate).length;
  
  console.log(`\n📈 Data Coverage:`);
  console.log(`   Total ZIP codes: ${totalZips}`);
  console.log(`   Both home + rent: ${bothValues}`);
  console.log(`   Home appreciation rates: ${homeGrowthRates}`);
  console.log(`   Rent growth rates: ${rentGrowthRates}`);
  console.log(`   Property tax rates: ${withPropertyTax}`);
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to file
  console.log(`\n💾 Writing to: ${OUTPUT_PATH}`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mergedData, null, 2));
  
  // Check file size
  const stats = fs.statSync(OUTPUT_PATH);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n✅ SUCCESS!`);
  console.log(`   Output file size: ${fileSizeInMB} MB`);
  console.log(`   Location: ${OUTPUT_PATH}`);
  console.log(`\n🎉 Enhanced data ready! Now includes:`);
  console.log(`   • Current home values`);
  console.log(`   • Current rent values`);
  console.log(`   • 5-year home appreciation rates`);
  console.log(`   • 5-year rent growth rates`);
  console.log(`   • State-level property tax rates`);
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}