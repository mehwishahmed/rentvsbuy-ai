const fs = require('fs');
const path = require('path');

// File paths
const ZHVI_PATH = '/Users/mehwishahmed/Desktop/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const ZORI_PATH = '/Users/mehwishahmed/Desktop/Zip_zori_uc_sfrcondomfr_sm_month.csv';
const OUTPUT_PATH = path.join(__dirname, '../src/data/zipCodeData.json');

console.log('🚀 Starting Zillow data processing...\n');

// Function to parse CSV and extract latest values
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
  
  // Find the last date column (latest month)
  const dateColumns = headers.filter(h => h.match(/\d{4}-\d{2}-\d{2}/));
  const latestDateColumn = dateColumns[dateColumns.length - 1];
  console.log(`   Latest data: ${latestDateColumn}`);
  
  // Find column indices
  const regionNameIndex = headers.indexOf('RegionName');
  const stateIndex = headers.indexOf('StateName');
  const cityIndex = headers.indexOf('City');
  const latestValueIndex = headers.indexOf(latestDateColumn);
  
  if (regionNameIndex === -1 || latestValueIndex === -1) {
    throw new Error('Required columns not found');
  }
  
  // Parse data
  const data = {};
  let processedCount = 0;
  let skippedCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const zipCode = values[regionNameIndex];
    const state = values[stateIndex] || '';
    const city = values[cityIndex] || '';
    const value = parseFloat(values[latestValueIndex]);
    
    // Skip if no valid value
    if (!zipCode || isNaN(value)) {
      skippedCount++;
      continue;
    }
    
    data[zipCode] = {
      state,
      city,
      [valueType]: Math.round(value)
    };
    processedCount++;
  }
  
  console.log(`   ✅ Processed ${processedCount} ZIP codes`);
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
  console.log('🔄 Merging datasets...');
  const mergedData = {};
  
  // Start with home data
  Object.keys(homeData).forEach(zip => {
    mergedData[zip] = { ...homeData[zip] };
  });
  
  // Add rent data
  Object.keys(rentData).forEach(zip => {
    if (mergedData[zip]) {
      mergedData[zip].rentValue = rentData[zip].rentValue;
    } else {
      mergedData[zip] = { ...rentData[zip] };
    }
  });
  
  // Count coverage
  const totalZips = Object.keys(mergedData).length;
  const bothValues = Object.values(mergedData).filter(d => d.homeValue && d.rentValue).length;
  const homeOnly = Object.values(mergedData).filter(d => d.homeValue && !d.rentValue).length;
  const rentOnly = Object.values(mergedData).filter(d => !d.homeValue && d.rentValue).length;
  
  console.log(`\n📈 Data Coverage:`);
  console.log(`   Total ZIP codes: ${totalZips}`);
  console.log(`   Both home + rent: ${bothValues}`);
  console.log(`   Home value only: ${homeOnly}`);
  console.log(`   Rent value only: ${rentOnly}`);
  
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
  console.log(`\n🎉 You can now use this data in your React app!`);
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}