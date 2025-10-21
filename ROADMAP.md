# 🗺️ RentVsBuy.ai - Product Roadmap

## 🎯 Vision
Build the most comprehensive, accurate, and user-friendly rent vs. buy calculator that helps people make informed housing decisions based on **realistic timeframes** and **location-specific data**.

---

## 📍 Current Status: v1.0 ✅

### Shipped Features:
- ✅ Conversational AI interface with GPT-4
- ✅ 5 comprehensive financial charts
- ✅ ZIP code integration (26,000+ locations)
- ✅ Location-specific property tax rates
- ✅ Dynamic scenario testing
- ✅ PDF export functionality
- ✅ Input confirmation & reference box
- ✅ Chart navigation buttons
- ✅ Summary insights modal

---

## 🚀 Development Phases

### **v1.2 - Time Horizons & Selling Costs** ⭐ **TOP PRIORITY**
> **Why:** Most people don't stay in homes for 30 years. This feature fundamentally changes recommendations and makes the tool far more realistic.

**Goal:** Analyze buy vs. rent for realistic timeframes (3, 5, 10, 15, 30 years)

**Tasks:**
- [ ] Add "How long do you plan to stay?" question to conversational flow
- [ ] Calculate realtor fees (6%) and closing costs (2%) when selling
- [ ] Update all existing charts to work with selected timeframe
- [ ] Create new chart: **Time Horizon Impact** (shows break-even point visually)
- [ ] AI warns if user plans to sell before break-even year
- [ ] Show selling costs clearly in Total Cost chart
- [ ] Add "What if I sell in X years?" scenario comparison

**Key Insights to Show:**
- "Your break-even point is **year 8**"
- "If you stay 10 years: Buying saves **$52,000**"
- "If you stay 5 years: Renting saves **$31,000**"
- "⚠️ Selling costs will eat **$36,000** if you sell early"

**Effort:** 2-3 days  
**Impact:** ⭐⭐⭐⭐⭐ VERY HIGH - Game changer

---

### **v1.3 - Location-Specific Growth Rates**
> **Why:** Home appreciation and rent growth vary wildly by location (SF: 5%, Detroit: 1%). Using accurate local data makes recommendations much more reliable.

**Goal:** Replace national averages with real location-specific appreciation and rent growth rates

**Tasks:**
- [ ] Research and collect Zillow/Redfin historical data
- [ ] Calculate 5-year average appreciation rates by metro area
- [ ] Calculate 5-year average rent growth rates by metro area
- [ ] Map ZIP codes to metro areas for data aggregation
- [ ] Add `homeAppreciationRate` field to `zipCodeData.json`
- [ ] Add `rentGrowthRate` field to `zipCodeData.json`
- [ ] Update `calculator.ts` to use location-specific rates
- [ ] Update reference box to show source: "🏘️ Appreciation: 4.2%/year (SF 5-yr avg)"
- [ ] Add disclaimer: "Based on 5-year historical averages for [Metro Area]"

**Example Data:**
```json
{
  "94102": {
    "city": "San Francisco",
    "state": "CA",
    "homeValue": 1709058,
    "rentValue": 5450,
    "propertyTaxRate": 0.76,
    "homeAppreciationRate": 5.2,  // NEW
    "rentGrowthRate": 4.8           // NEW
  }
}
```

**Effort:** 2-3 days  
**Impact:** ⭐⭐⭐⭐ HIGH - Significantly improves accuracy

---

### **v1.4 - Advanced Charts (Part 1)** 📊
> **Why:** Current charts show the basics. These new charts answer specific user questions and provide actionable insights.

**Goal:** Add 3 high-impact charts that address common user questions

**Charts to Build:**

1. **Break-Even Timeline Chart** ⭐ **MOST REQUESTED**
   - Visual timeline showing when buying becomes better than renting
   - Markers for key milestones (down payment recovered, equity > rent paid, etc.)
   - Clear indication: "You break even in Year 8"
   
2. **Tax Savings Breakdown**
   - Mortgage interest deduction over time
   - Property tax deduction
   - Total tax savings: buying vs. renting
   - State-specific tax brackets
   - Shows: "You save $8,500/year in taxes by buying"

3. **Closing Costs Impact**
   - One-time costs: buying (closing costs, inspections) vs. renting (broker fees, deposits)
   - Amortized over different time horizons (3, 5, 10, 30 years)
   - Shows: "If you sell in 5 years, closing costs = $X/month effective cost"

**Effort:** 3-4 days (1 day per chart + testing)  
**Impact:** ⭐⭐⭐⭐ HIGH - Answers specific user questions

---

### **🎯 MILESTONE: Launch & User Feedback**
**Goal:** Get 500+ users and gather real feedback before building more features

**Tasks:**
- [ ] Launch on ProductHunt
- [ ] Post on Reddit (r/personalfinance, r/RealEstate, r/FirstTimeHomeBuyer)
- [ ] Share on Twitter/LinkedIn
- [ ] Add feedback form: "What feature would you like to see next?"
- [ ] Analytics: Track which charts users view most
- [ ] User interviews: 10-20 users for deep feedback

**Success Metrics:**
- 500+ unique users
- 50+ feedback responses
- Identify top 3 most-requested features

**Effort:** 1-2 weeks  
**Impact:** ⭐⭐⭐⭐⭐ CRITICAL - Validates product-market fit

---

### **v1.5 - Advanced Charts (Part 2)** 📊
> **Build these ONLY if user feedback shows demand**

**Additional Charts (Pick 2-3 based on feedback):**

4. **Cash Flow Comparison**
   - Month-by-month cash position (buying vs. renting)
   - Accounts for tax refunds, HELOC access, emergency fund
   - Shows liquidity risk

5. **Liquidity & Risk Chart**
   - How much cash you have available each year
   - "What if you lose your job?" scenarios
   - Emergency fund impact analysis

6. **Inflation-Adjusted Net Worth**
   - Same as current Net Worth chart but inflation-adjusted
   - Shows "real" purchasing power over time

7. **Market Timing Simulator**
   - "What if you buy now vs. wait 1 year?"
   - Models different appreciation scenarios (bull/bear market)
   - Opportunity cost of waiting

8. **Amortization Schedule (Interactive)**
   - Month-by-month principal vs. interest
   - Cumulative equity buildup
   - "Pay extra $500/month" comparison

9. **Side-by-Side Scenario Comparison**
   - Compare 2-3 scenarios simultaneously
   - "$500k house vs. $600k house"
   - "20% down vs. 10% down"
   - All charts side-by-side

**Effort:** 1 week (build top 2-3 requested charts)  
**Impact:** ⭐⭐⭐ MEDIUM-HIGH - Depends on user demand

---

### **v1.6 - Interactive Sliders & What-If Tool** 🎚️
> **Build if users ask: "Can I change the assumptions?"**

**Goal:** Let users play with assumptions in real-time without restarting

**Features:**
- [ ] Sliders for mortgage rate (4% - 10%)
- [ ] Sliders for appreciation rate (-5% to 15%)
- [ ] Sliders for rent growth (0% - 10%)
- [ ] Sliders for investment returns (3% - 12%)
- [ ] Loan term selector (15/20/30 years)
- [ ] Charts update live as sliders move (debounced)
- [ ] "Reset to defaults" button
- [ ] Save scenarios with custom names ("Conservative", "Optimistic", "Worst Case")
- [ ] Quick-load saved scenarios from dropdown

**UI Example:**
```
┌─────────────────────────────────────────┐
│ Adjust Assumptions:                     │
│                                          │
│ Mortgage Rate:    [━━━●━━━] 7.0%       │
│ Appreciation:     [━━●━━━━] 3.0%       │
│ Rent Growth:      [━━━●━━━] 3.5%       │
│ Investment Return:[━━━━●━━] 7.0%       │
│                                          │
│ [Reset] [Save Scenario As...]           │
└─────────────────────────────────────────┘
```

**Effort:** 1 week  
**Impact:** ⭐⭐⭐⭐ MEDIUM-HIGH - Great for power users

---

### **v1.7 - Database & User Accounts** 💾
> **Build if you have 1,000+ active users**

**Goal:** Store scenarios, enable saving/loading, gather analytics

**Tasks:**
- [ ] Set up Supabase (recommended) or Firebase
- [ ] Create database schema for scenarios
- [ ] Implement anonymous scenario saving (no account required)
- [ ] Optional: User accounts (email/password or Google OAuth)
- [ ] "Save Scenario" button in UI
- [ ] "Load Scenario" dropdown
- [ ] Privacy policy and data handling docs
- [ ] Analytics dashboard (admin-only):
  - Most common scenarios
  - Average break-even years by region
  - Popular chart combinations
  - Feature usage heatmap

**Privacy-First Approach:**
- No PII required (anonymous usage)
- Only save: home price, rent, down payment, ZIP, charts viewed
- Optional accounts for scenario persistence
- Clear data deletion policy

**Effort:** 3-5 days  
**Impact:** ⭐⭐⭐ MEDIUM - Enables future features, provides insights

---

### **v1.8 - AI Enhancements** 🤖
> **Build to make AI smarter and more proactive**

**Goal:** AI suggests scenarios, gives personalized insights, assesses risk

**Features:**
- [ ] AI auto-generates 3 scenarios (conservative/moderate/aggressive)
- [ ] Personalized affordability insights:
  - "For your income level, this house is at the high end"
  - "You're in a high-growth area—buying locks in costs"
- [ ] Risk tolerance assessment questions
- [ ] Better multi-scenario handling:
  - "Let me show you 3 scenarios and you pick your favorite"
- [ ] Conversation memory (remember preferences across session)
- [ ] Voice input support (stretch goal - Web Speech API)

**Example AI Behavior:**
```
AI: Based on your situation, I'd recommend looking at 3 scenarios:

1. Conservative: $400k house, 20% down → Break-even in 6 years
2. Moderate: $500k house, 15% down → Break-even in 8 years  
3. Aggressive: $600k house, 10% down → Break-even in 10 years

Want to see the comparison?
```

**Effort:** 1-2 weeks  
**Impact:** ⭐⭐⭐⭐ HIGH - Makes tool more intelligent

---

### **v2.0 - Mobile App** 📱
> **Only build if web version has 5,000+ users**

**Goal:** Native iOS/Android app for broader reach

**Approach:**
- [ ] React Native (maximize code reuse from web)
- [ ] Offline mode (save scenarios locally)
- [ ] Push notifications for rate changes (optional)
- [ ] App Store optimization (screenshots, description)
- [ ] iOS App Store submission
- [ ] Android Play Store submission
- [ ] Mobile-specific UX improvements (swipe gestures, native inputs)

**Effort:** 3-4 weeks  
**Impact:** ⭐⭐⭐⭐ HIGH - Broader reach, but only if web version proves demand

---

## 📋 Backlog / Nice-to-Have

### Features to Consider Later:
- [ ] Standalone mortgage calculator tool
- [ ] Refinancing scenario modeling
- [ ] Different mortgage products (15-year, ARM, FHA, VA loans)
- [ ] "Rent vs Buy vs Invest" three-way analysis
- [ ] Live market trend integration (API feeds for rates/prices)
- [ ] Share scenarios via link (unique URL)
- [ ] Printable reports (formatted HTML/Word export)
- [ ] Dark mode UI
- [ ] Multi-language support (Spanish, Mandarin, Hindi)
- [ ] Accessibility improvements (WCAG 2.1 AA compliance)
- [ ] Browser extension (quick calc from Zillow/Redfin listings)

---

## 🎯 Recommended Execution Plan

### **Phase 1: Ship Core Features (Weeks 1-2)**
1. ✅ v1.2 - Time Horizons (2-3 days) ⭐ **PRIORITY #1**
2. ✅ v1.3 - Location Rates (2-3 days)
3. ✅ v1.4 - Top 3 Charts (3-4 days)
4. 🚀 **Public Launch** - ProductHunt, Reddit, Twitter

### **Phase 2: Learn & Iterate (Weeks 3-4)**
5. 📊 Get 500+ users
6. 📝 Gather feedback (surveys, interviews)
7. 📈 Analyze usage data (which charts, which features)
8. 🤔 Decide what to build next based on data

### **Phase 3: Double Down (Weeks 5+)**
9. Build v1.5+ features **only if** users request them
10. Iterate based on real usage patterns
11. Consider v1.7 (database) if 1,000+ users
12. Consider v2.0 (mobile) if 5,000+ users

---

## 📊 Success Metrics

### **v1.2-v1.4 Launch Goals:**
- 500+ unique users in first month
- 50+ user feedback responses
- 20% user return rate (come back to try new scenarios)
- 30% PDF export rate (indicates serious usage)

### **Long-Term Goals (6 months):**
- 5,000+ total users
- Featured on ProductHunt (top 10 of the day)
- Mentioned in finance blogs/podcasts
- 1,000+ saved scenarios (if database implemented)
- 10+ testimonials from users who made decisions using the tool

---

## 🔄 Review & Update Schedule

This roadmap will be reviewed and updated:
- **After v1.4 launch** - based on user feedback
- **Every month** - adjust priorities based on data
- **Quarterly** - reassess long-term vision

**Last Updated:** January 2025  
**Next Review:** After v1.4 launch + 500 users

---

## 💡 Guiding Principles

1. **User feedback > assumptions** - Build what users ask for, not what we think they need
2. **Ship fast, iterate faster** - Better to launch and learn than build in isolation
3. **Accuracy > features** - One accurate chart beats five inaccurate ones
4. **Simple > complex** - If a feature requires explanation, simplify it
5. **Mobile-first thinking** - Even on web, design for small screens
6. **Privacy-first** - Never require more data than necessary

---

**Questions or suggestions?** Open an issue or contact [@mehwishahmed](https://github.com/mehwishahmed)

