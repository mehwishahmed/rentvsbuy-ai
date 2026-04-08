# RentVsBuy.ai 🏠 🌐 Live Demo: https://rentvsbuy.ai

An AI-powered financial advisor that helps you make informed decisions about whether to buy a house or keep renting. Get personalized insights through a conversational interface with interactive charts and downloadable reports.

## 🌟 What is RentVsBuy.ai?

RentVsBuy.ai is a web application that analyzes your housing situation and provides data-driven comparisons between buying a home and continuing to rent. Unlike traditional calculators, this tool uses AI to have natural conversations with you, understand your financial situation, and generate visual comparisons tailored to your specific scenario.

**Repository:** [github.com/mehwishahmed/rentvsbuy-ai](https://github.com/mehwishahmed/rentvsbuy-ai)

## ✨ Features

### 💬 Conversational AI Interface
- Natural language interaction powered by OpenAI GPT-4 (with graceful offline fallback)
- Friendly, approachable advisor that explains complex financial concepts
- Asks 2-3 questions at once for faster data collection
- Handles distractions and invalid input gracefully
- No complicated forms—just chat naturally

### 📊 Interactive Financial Charts
The app generates **comprehensive charts** to help you visualize your financial future:

**Core Charts:**
1. **Net Worth Comparison** - Shows how your wealth grows over your timeline when buying vs. renting
2. **Monthly Cost Breakdown** - Compares monthly expenses for buying (mortgage, taxes, insurance, maintenance) vs. renting
3. **Total Cost Comparison** - Calculates the true cost of each option after your timeline, factoring in home appreciation and investment returns
4. **Home Equity Buildup** - Visualizes how much equity you build in a home over time
5. **Rent Growth vs Fixed Mortgage** - Demonstrates how rent increases over time while mortgage payments stay fixed
6. **Break-Even Timeline** - Shows exactly when buying starts paying off with visual timeline

**Advanced Charts:**
- **Cash Flow Analysis** - Monthly cash flow comparison
- **Cumulative Cost Tracking** - Running totals over time
- **Tax Savings** - Mortgage interest deduction benefits
- **Monte Carlo Simulation** - 1,000+ simulated scenarios for risk analysis
- **Sensitivity Analysis** - Impact of rate changes on outcomes
- **Break-Even Heatmap** - Visual break-even analysis across scenarios

### ⏰ Time Horizon Analysis (NEW!)
- **Custom timeline support** - Analyze any timeframe (3, 5, 10+ years)
- **Selling costs calculator** - 8% total costs (6% realtor + 2% closing) applied at timeline end
- **Timeline-based assumptions** - Conservative for short-term, optimistic for long-term
- **Break-even visualization** - See exactly when buying pays off
- **AI warnings** for scenarios where early selling makes buying disadvantageous

### 🔄 Dynamic Scenario Testing
- Test multiple scenarios in a single conversation
- Change home price, rent, down payment, or timeline mid-chat
- Switch between different ZIP codes to compare locations
- Historical charts remain visible for comparison
- All chart navigation buttons refresh when you provide new data
- **Editable input reference box** - Lock/unlock mode to modify values
- Real-time recalculation when values are changed

### 📍 Location-Based Data (NEW!)
- Mention any ZIP code to get local market data for 26,000+ locations
- Automatically pulls median home prices and average rent for your area
- Location-specific property tax rates by state
- Choose to use local data OR enter your own custom values
- Reference box shows exactly what data is being used (local vs. custom vs. national averages)
- Switch ZIP codes mid-conversation to compare different areas

### 🎯 AI-Powered Recommendations
- **Smart recommendations** - Get personalized "Buy" or "Rent" recommendations based on your scenario
- **Savings calculations** - See exactly how much you'll save with each option
- **Reasoning explanations** - Understand why the AI recommends one option over another
- **Interactive cards** - Click to see detailed breakdowns and explore different scenarios

### 💾 Professional PDF Export
- Save your entire conversation and all charts in a single PDF
- **Complete input documentation** - All parameters and assumptions included
- **High-quality chart capture** - Full colors and contrast preserved
- Share with family, financial advisors, or real estate agents
- Clean, professional formatting suitable for decision-making meetings
- Progress indicator shows PDF generation status

### 📈 Accurate Financial Calculations
All calculations use industry-standard formulas:
- Mortgage amortization with proper interest calculations
- Property tax, insurance, and maintenance estimates
- **Timeline-based growth rates** - Conservative for short-term, optimistic for long-term
- **Location-specific rates** - ZIP code data for appreciation, rent growth, and property taxes
- **Selling costs integration** - 8% total costs applied at timeline end
- **Monthly cash flow tracking** - Proper investment of savings/differences

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn
- Python 3.11+
- pip (or uv)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mehwishahmed/rentvsbuy-ai.git
   cd rentvsbuy-ai
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Create a Python virtual environment and install backend dependencies**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate        # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

4. **Configure environment variables**
   - Backend (`backend/.env` — this file is ignored by git):
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     ```
     > 🛡️ Keep this file local. Git push protection will block commits if the key is present in history.
   - Frontend (`.env`, optional): override the backend URL if you are not using the default `http://localhost:8000`.
     ```env
     VITE_BACKEND_URL=http://localhost:8000
     ```

### Running the app locally

1. **Start the Python backend**
   ```bash
   cd backend
   source .venv/bin/activate        # On Windows use: .venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start the Vite frontend (new terminal)**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   
   Navigate to `http://localhost:5173`

### Backend API at a glance

- **App entrypoint:** `backend/app/main.py` (FastAPI)
- **Finance analysis:** `POST /api/finance/analyze`
  - Calculates monthly snapshots, totals, and cost breakdowns
- **AI chat proxy:** `POST /api/ai/chat`
  - Passes chat history to OpenAI when a key is available
  - Gracefully falls back to a local “Mock AI” when no key or an API failure occurs
- **Health check:** `GET /health`

### Troubleshooting

#### "Sorry, I'm having trouble connecting" Error

This error means the frontend can't reach the backend. Follow these steps:

1. **Check if backend is running:**
   - Open a terminal and verify you see: `Uvicorn running on http://127.0.0.1:8000`
   - If not, start it:
     ```bash
     cd backend
     source .venv/bin/activate  # On Windows: .venv\Scripts\activate
     uvicorn app.main:app --reload --port 8000
     ```

2. **Test backend health:**
   - Open `http://localhost:8000/health` in your browser
   - Should return: `{"status":"ok"}`
   - If it doesn't load, the backend isn't running

3. **Check browser console:**
   - Open DevTools (F12) → Console tab
   - Look for red errors like `Failed to fetch` or `NetworkError`
   - These indicate the frontend can't reach the backend

4. **Verify backend URL:**
   - Check if `.env` file exists in root with:
     ```env
     VITE_BACKEND_URL=http://localhost:8000
     ```
   - If missing, create it (or frontend defaults to `http://localhost:8000`)

5. **Check OpenAI API key:**
   - Ensure `backend/.env` exists with:
     ```env
     OPENAI_API_KEY=sk-...
     ```
   - Without it, backend may fail on AI calls

6. **Verify both terminals are running:**
   - **Terminal 1:** Backend (`uvicorn app.main:app --reload --port 8000`)
   - **Terminal 2:** Frontend (`npm run dev`)

#### Other Common Issues

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Response begins with `(Mock AI)` | Backend is running in fallback mode (no key or API error) | Add/verify `OPENAI_API_KEY` in `backend/.env` and restart the backend. |
| `Address already in use` when starting backend | Previous `uvicorn` still running | Stop old process (`Ctrl+C` or `pkill -f "uvicorn backend.app.main"`). |
| `Module not found` errors | Dependencies not installed | Run `npm install` (frontend) or `pip install -r requirements.txt` (backend). |
| `Python not found` | Python not installed or not in PATH | Install Python 3.11+ and ensure it's in your PATH. |
| Git push blocked by secret scanning | `.env` accidentally staged | `git reset --soft HEAD~1`, remove `.env` from staging, recommit. |

### Staying Up-To-Date Locally

Whenever new work lands on the shared branch (`dev/charts`), pull it down like this:

```bash
git fetch origin
git checkout dev/charts
git pull origin dev/charts
```

Then start both services:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd ../
npm install
npm run dev
```

After these steps, your local environment will match the latest committed state (all tabs, design updates, charts, docs, etc.).

## 📖 How to Use

### Basic Workflow

1. **Start a conversation**
   - The AI will greet you and ask about your situation
   - **Option A:** Mention your ZIP code (e.g., "I'm in 92129") to get local data
     - The Phase 1 card auto-fills the “Current focus” snapshot—no buttons or inputs required
   - **Option B:** Provide your own values directly
   - Four key pieces of information needed:
     - Home price (e.g., "$500,000" or "500k")
     - Monthly rent (e.g., "$3,000" or "3k")
     - Down payment percentage (e.g., "20%" or "20")
     - Time horizon (e.g., "5 years" or "10")

2. **Get instant analysis**
   - Once you provide all four values, charts are generated in the background
   - Reference box appears showing all values being used (with sources: ZIP data vs. custom vs. national averages)
   - Timeline-based assumptions automatically applied

3. **Request charts**
   - Ask to see any of the 6 available charts
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
   - Provide all four values at once: "$600k, $4k, 25%, 7 years"
   - New charts generate while old ones remain for comparison
   - Or use the editable reference box to modify values

6. **Save your analysis**
   - Click the "Save Chat" button
   - Download a professional PDF with conversation and all charts
   - Share with stakeholders for informed decision-making

### 🆕 Advanced Features Guide

#### ⏰ Time Horizon Analysis
**How to use:**
- When asked "How long do you plan to stay in this home?", provide any timeframe:
  - "3 years" (short-term analysis with conservative assumptions)
  - "7 years" (medium-term with moderate assumptions) 
  - "15 years" (long-term with optimistic assumptions)
- **Selling costs automatically applied** at your timeline end (8% total)
- **Timeline-based assumptions** adjust growth rates based on your timeframe
- **Break-even chart** shows exactly when buying pays off

#### 📍 ZIP Code Integration
**How to use:**
- **Mention any ZIP code** in your chat: "I'm in 90210" or "Looking at 78717"
- The Phase 1 “Current focus” card immediately fills with that market’s snapshot
- Just continue with your down payment % and timeline—no extra buttons needed
- **Local data includes:**
  - Median home price for your area
  - Average rent for your ZIP code
  - Property tax rate for your state
  - Local appreciation and rent growth rates
- **Switch locations mid-conversation** by mentioning a new ZIP or city name

#### ✏️ Editable Input Reference Box
**How to use:**
- **View current values** in the "Your Inputs" box (top right)
- **Click "Edit Values"** to modify any parameter
- **Make changes** to home price, rent, down payment, or timeline
- **Click "Save Changes"** to recalculate all charts with new values
- **Click "Cancel"** to discard changes
- **Real-time updates** - charts automatically refresh with new calculations

#### 🤖 AI-Powered Data Extraction
**How to use:**
- **Natural language input** - "I'm looking at $500k, paying $3k rent, 20% down, planning to stay 7 years"
- **Combined inputs** - "10% and 10 years" (down payment and timeline together)
- **Flexible formats** - "$500k", "500k", "500000" all work
- **ZIP code detection** - "I'm in 92127" automatically triggers local data lookup
- **Tone matching** - AI adapts to your casual or formal communication style

#### 📊 Chart Navigation
**Available charts:**
1. **Net Worth Comparison** - "show me net worth" or "net worth comparison"
2. **Monthly Cost Breakdown** - "show me monthly costs" or "monthly costs breakdown"  
3. **Total Cost Comparison** - "show me total cost" or "total costs"
4. **Home Equity Buildup** - "show me equity" or "equity buildup"
5. **Rent Growth vs Mortgage** - "show me rent growth" or "rent vs mortgage"
6. **Break-Even Timeline** - "show me break even" or "when does buying pay off"

**Chart buttons** appear after providing all inputs - click any button for instant chart access.

#### 💾 PDF Export Features
**What's included:**
- **Complete conversation** with all your questions and AI responses
- **All 6 charts** in high quality
- **Your Inputs section** with all parameters and assumptions
- **Source attribution** (ZIP data vs. custom vs. timeline-based)
- **Professional formatting** suitable for sharing with advisors

**How to save:**
- Click "Save Chat" button (top right)
- Wait for progress indicator to complete
- PDF automatically downloads with your analysis

### 🚀 Quick Reference for Power Users

#### 💬 Natural Language Examples
```
"I'm in 90210, looking at $1.2M, paying $4k rent, 15% down, staying 8 years"
"Can I try 78717 with $800k, $2.5k rent, 20%, 5 years?"
"Show me the break-even timeline"
"What if I stay 3 years instead?"
```

#### 🔄 Workflow Shortcuts
- **All-in-one input:** Provide all 4 values in one message
- **ZIP code first:** Mention location to get local data options
- **Edit mode:** Use reference box for quick value changes
- **Chart requests:** Use natural language or click buttons
- **Scenario testing:** Say "new values" to start fresh

#### 📊 Chart Triggers
- **Net Worth:** "net worth", "wealth", "money over time"
- **Monthly Costs:** "monthly costs", "expenses", "monthly breakdown"
- **Total Cost:** "total cost", "total costs", "30-year cost"
- **Equity:** "equity", "home equity", "equity buildup"
- **Rent Growth:** "rent growth", "rent vs mortgage", "rent increases"
- **Break-Even:** "break even", "when does buying pay off", "break-even point"

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

### 6. Break-Even Timeline (NEW!)
**What it shows:** Exactly when buying starts paying off

**Key insights:**
- Shows net worth difference over your timeline
- Visual break-even point where lines cross
- "Buying wins from start" vs "Break-even at year X" vs "Renting wins"
- Accounts for selling costs at timeline end

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
│   │   ├── charts/           # Chart components
│   │   │   ├── NetWorthChart.tsx
│   │   │   ├── MonthlyCostChart.tsx
│   │   │   ├── TotalCostChart.tsx
│   │   │   ├── EquityBuildupChart.tsx
│   │   │   ├── RentGrowthChart.tsx
│   │   │   ├── BreakEvenChart.tsx
│   │   │   ├── CashFlowChart.tsx
│   │   │   ├── CumulativeCostChart.tsx
│   │   │   ├── TaxSavingsChart.tsx
│   │   │   ├── MonteCarloChart.tsx
│   │   │   ├── SensitivityChart.tsx
│   │   │   ├── ChartPlaceholder.tsx
│   │   │   └── ChartExplanation.tsx
│   │   ├── chat/             # Chat interface
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── SuggestionChips.tsx
│   │   ├── RecommendationCard/  # AI recommendation display
│   │   ├── LoadingIndicator/    # Loading states
│   │   └── ErrorBoundary.tsx     # Error handling
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
│   │   ├── calculator.ts      # TypeScript types
│   │   └── recommendation.ts  # Recommendation types
│   ├── hooks/
│   │   └── useScenarioState.ts  # Scenario state management
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

---

**⚠️ Disclaimer:** This tool provides educational estimates and should not be considered financial advice. Consult with a qualified financial advisor before making major financial decisions. Actual costs, appreciation rates, and returns may vary significantly based on location, market conditions, and individual circumstances.

---

Made with ❤️
