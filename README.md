# RentVsBuy.ai 🏠

An AI-powered financial advisor that helps you make informed decisions about whether to buy a house or keep renting. Get personalized insights through a conversational interface with interactive charts and downloadable reports.

## 🌟 What is RentVsBuy.ai?

RentVsBuy.ai is a web application that analyzes your housing situation and provides data-driven comparisons between buying a home and continuing to rent. Unlike traditional calculators, this tool uses AI to have natural conversations with you, understand your financial situation, and generate visual comparisons tailored to your specific scenario.

**Repository:** [github.com/mehwishahmed/rentvsbuy-ai](https://github.com/mehwishahmed/rentvsbuy-ai)

## ✨ Features

### 💬 Conversational AI Interface
- Natural language interaction powered by OpenAI GPT-4
- Friendly, approachable advisor that explains complex financial concepts
- Asks 2-3 questions at once for faster data collection
- Handles distractions and invalid input gracefully
- No complicated forms—just chat naturally

### 📊 Interactive Financial Charts
The app generates **5 comprehensive charts** to help you visualize your financial future:

1. **Net Worth Comparison** - Shows how your wealth grows over 30 years when buying vs. renting
2. **Monthly Cost Breakdown** - Compares monthly expenses for buying (mortgage, taxes, insurance, maintenance) vs. renting
3. **30-Year Total Cost** - Calculates the true cost of each option after 30 years, factoring in home appreciation and investment returns
4. **Home Equity Buildup** - Visualizes how much equity you build in a home over time
5. **Rent Growth vs Fixed Mortgage** - Demonstrates how rent increases over time while mortgage payments stay fixed

### 📊 Key Insights Summary
- Instant "Bottom Line" summary modal (click "💡 Summary" button)
- Shows winner (Buying vs Renting) with 30-year savings
- Monthly cost difference at a glance
- Break-even year calculation
- Risk assessment based on down payment percentage
- Professional, unobtrusive design that appears on demand

### 🔄 Dynamic Scenario Testing
- Test multiple scenarios in a single conversation
- Change home price, rent, or down payment mid-chat
- Switch between different ZIP codes to compare locations
- Historical charts remain visible for comparison
- All chart navigation buttons refresh when you provide new data
- Input confirmation card shows your current scenario at a glance

### 📍 Location-Based Data (NEW!)
- Mention any ZIP code to get local market data for 26,000+ locations
- Automatically pulls median home prices and average rent for your area
- Location-specific property tax rates by state
- Choose to use local data OR enter your own custom values
- Reference box shows exactly what data is being used (local vs. custom vs. national averages)
- Switch ZIP codes mid-conversation to compare different areas

### 💾 Professional PDF Export
- Save your entire conversation and all charts in a single PDF
- Share with family, financial advisors, or real estate agents
- Clean, professional formatting suitable for decision-making meetings
- Progress indicator shows PDF generation status

### 📈 Accurate Financial Calculations
All calculations use industry-standard formulas:
- Mortgage amortization with proper interest calculations
- Property tax, insurance, and maintenance estimates
- Rent growth projections (3.5% annually)
- Home appreciation (3% annually)
- Investment returns (7% annually for down payment alternatives)

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mehwishahmed/rentvsbuy-ai.git
   cd rentvsbuy-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

   Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📖 How to Use

### Basic Workflow

1. **Start a conversation**
   - The AI will greet you and ask about your situation
   - **Option A:** Mention your ZIP code (e.g., "I'm in 92129") to get local data
   - **Option B:** Provide your own values directly
   - Three key pieces of information needed:
     - Home price (e.g., "$500,000" or "500k")
     - Monthly rent (e.g., "$3,000" or "3k")
     - Down payment percentage (e.g., "20%" or "20")

2. **Get instant analysis**
   - Once you provide all three values, charts are generated in the background
   - Input confirmation card shows your scenario
   - Reference box appears showing all values being used (with sources: ZIP data vs. custom vs. national averages)

3. **Request charts**
   - Ask to see any of the 5 available charts
   - Use natural language: "show me net worth comparison" or "can I see monthly costs?"
   - Click dedicated chart navigation buttons for instant access
   - Click suggestion chips for contextual questions

4. **Ask questions**
   - "What if rent increases faster?"
   - "When does buying pay off?"
   - "How much equity will I have in 10 years?"
   - The AI explains concepts and offers to show relevant charts

5. **Try new scenarios**
   - Say "can I try new values"
   - Provide all three values at once: "$600k, $4k, 25%"
   - New charts generate while old ones remain for comparison

6. **Save your analysis**
   - Click the "Save Chat" button
   - Download a professional PDF with conversation and all charts
   - Share with stakeholders for informed decision-making

### Example Conversation

```
AI: Hi! I'm your rent vs buy advisor. Tell me about your situation - 
    what's the price of the house you're looking at?

You: I'm looking at a $500,000 home

AI: Got it! Now, what's your current monthly rent?

You: $3,000

AI: And what down payment are you thinking?

You: 20%

AI: Alright! So with a $500k house and $3k rent, you're looking at 
    pretty similar monthly costs. Want to see how your wealth builds 
    up over 30 years? I can show you your Net Worth Comparison!

You: yes please

AI: Here's your Net Worth Comparison!
    [Chart displays with detailed breakdown]

You: When does buying pay off?

AI: Based on your numbers, buying typically becomes more beneficial 
    around year 7-8, when your home equity and appreciation start 
    outpacing what you'd have by renting and investing. Want to see 
    the Total Cost Comparison over 30 years?
```

## 🎯 Available Charts

### 1. Net Worth Comparison
**What it shows:** Your total net worth over 30 years for both scenarios

**Key insights:**
- Blue line = Buying (home equity + appreciation)
- Red line = Renting (invested down payment + savings)
- See the crossover point where one option becomes more valuable

### 2. Monthly Cost Breakdown
**What it shows:** First-year monthly expenses for each option

**Includes:**
- **Buying:** Mortgage, property tax, home insurance, HOA, maintenance
- **Renting:** Rent + renter's insurance

### 3. 30-Year Total Cost Comparison
**What it shows:** True cost after accounting for home value and investments

**Calculates:**
- Total spent over 30 years
- Final home value or investment value
- Net cost (what you really paid after asset value)

### 4. Home Equity Buildup
**What it shows:** How much home equity you accumulate each year

**Useful for:**
- Understanding the pace of equity growth
- Planning for refinancing or selling
- Seeing when you hit meaningful equity milestones

### 5. Rent Growth vs Fixed Mortgage
**What it shows:** How rent increases while mortgage stays fixed

**Demonstrates:**
- Rent grows ~3.5% annually
- Mortgage payment is locked in for 30 years
- The "rent trap" where costs spiral over time

## 🔧 Current Limitations & Future Plans

### Current Limitations
This project is in **active development** and currently operates at a foundational level. Here are the current constraints:

**Input Data:**
- Requires only 3 basic inputs (home price, rent, down payment)
- Uses default values for interest rates and insurance
- ~~No location-specific data~~ ✅ **NEW: ZIP code integration with 26,000+ locations**
- ~~Property taxes vary by state/city~~ ✅ **NEW: Location-specific property tax rates**
- No customization for investment returns or appreciation rates in UI (uses industry standards)

**Chart Options:**
- Limited to 5 pre-built chart types
- Cannot compare multiple scenarios side-by-side
- No mortgage rate or loan term adjustments in UI

**Assumptions:**
- 7% mortgage interest rate (industry standard for current market)
- 30-year fixed loan term
- ~~1% annual property tax rate~~ ✅ **NEW: Location-specific rates (0.3% - 2.5% depending on state)**
- 3% home appreciation rate (national average)
- 3.5% rent growth rate (national average)
- 7% investment return rate (S&P 500 historical average)

### Planned Features 🚀

**Phase 1: Enhanced Input Options**
- ~~ZIP code integration for location-specific data~~ ✅ **COMPLETED**
- ~~Property tax rates based on location~~ ✅ **COMPLETED**
- Adjustable interest rates and loan terms (UI sliders)
- Custom insurance and HOA costs (UI inputs)
- Home appreciation and rent growth rate customization per location

**Phase 2: Advanced Charts**
- Sensitivity analysis (what-if scenarios)
- Tax benefit breakdown charts
- Closing costs vs. renting costs comparison
- Break-even timeline visualization
- Amortization schedule viewer

**Phase 3: Comparison Tools**
- Side-by-side scenario comparison
- "Rent vs Buy vs Invest" three-way analysis
- Different mortgage products (15-year, ARM, etc.)
- Refinancing scenario modeling

**Phase 4: Smart Recommendations**
- Personalized advice based on your financial profile
- Risk assessment for your situation
- Market trend integration
- Affordability score

## 🏗️ Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** CSS3 (custom design)
- **Charts:** Recharts
- **AI:** OpenAI GPT-4o-mini
- **PDF Export:** jsPDF + html2canvas
- **Build Tool:** Vite
- **State Management:** React Hooks

## 📁 Project Structure

```
rentvsbuy-ai/
├── src/
│   ├── components/
│   │   ├── charts/           # 5 chart components
│   │   │   ├── NetWorthChart.tsx
│   │   │   ├── MonthlyCostChart.tsx
│   │   │   ├── TotalCostChart.tsx
│   │   │   ├── EquityBuildupChart.tsx
│   │   │   └── RentGrowthChart.tsx
│   │   └── chat/             # Chat interface
│   │       ├── ChatContainer.tsx
│   │       ├── ChatInput.tsx
│   │       ├── ChatMessage.tsx
│   │       └── SuggestionChips.tsx
│   ├── data/
│   │   └── zipCodeData.json  # 26,000+ ZIP codes with market data
│   ├── lib/
│   │   ├── ai/
│   │   │   └── openai.ts     # AI integration
│   │   ├── finance/
│   │   │   ├── calculator.ts  # Financial formulas
│   │   │   └── calculator.test.ts
│   │   └── location/
│   │       └── zipCodeService.ts  # ZIP code data service
│   ├── types/
│   │   └── calculator.ts      # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── README.md
```

## 🧪 Financial Formula Accuracy

All calculations have been audited and verified to ensure accuracy:

✅ **Mortgage Payment Formula:** Standard amortization formula  
✅ **Property Tax Calculation:** Annual rate applied to home value  
✅ **Home Appreciation:** Compound growth at 3% annually  
✅ **Rent Growth:** Compound growth at 3.5% annually  
✅ **Investment Returns:** Compound returns at 7% annually  
✅ **Total Cost Analysis:** Accounts for opportunity cost of down payment  

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Recharts for beautiful, responsive charts
- The personal finance community for calculation validation

## 📧 Contact

**Project Maintainer:** Mehwish Ahmed  
**GitHub:** [@mehwishahmed](https://github.com/mehwishahmed)

---

**⚠️ Disclaimer:** This tool provides educational estimates and should not be considered financial advice. Consult with a qualified financial advisor before making major financial decisions. Actual costs, appreciation rates, and returns may vary significantly based on location, market conditions, and individual circumstances.

---

Made with ❤️ for better financial decisions
