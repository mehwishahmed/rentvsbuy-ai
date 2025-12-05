"""FastAPI application entrypoint."""

from __future__ import annotations

import json
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .config import get_settings
from .finance.calculator import (
    calculate_analysis, calculate_cash_flow, calculate_cumulative_costs, calculate_liquidity_timeline,
    calculate_tax_savings, calculate_sensitivity, calculate_scenarios, calculate_heatmap, calculate_monte_carlo)
from .models import (
    AnalysisRequest, AnalysisResponse, TimelinePoint, ScenarioRequest, SensitivityRequest,
    HeatmapRequest, MonteCarloRequest, HomePricePathSummary, ChartInsightRequest, ChartInsightResponse,
    SummaryInsightRequest, SummaryInsightResponse
)
from .services.openai_service import OpenAIService

settings = get_settings()

app = FastAPI(title="Rent vs Buy AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 200


def get_openai_service() -> OpenAIService:
    try:
        return OpenAIService()
    except ValueError as exc:  # pragma: no cover - configuration issue
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@app.post(f"{settings.api_prefix}/finance/analyze", response_model=AnalysisResponse)
def analyze_finance(request: AnalysisRequest) -> AnalysisResponse:
    """Unified analysis endpoint - returns single AnalysisResult with all data."""
    from .finance.calculator import calculate_unified_analysis
    
    # Apply ML predictions if ZIP code is provided
    inputs = request.inputs
    ml_rates_used = None  # Initialize
    if request.zipCode:
        print(f"[ML DEBUG] ========== ML Prediction Request ==========")
        print(f"[ML DEBUG] ZIP code provided: {request.zipCode}")
        print(f"[ML DEBUG] Original rates: home={inputs.homeAppreciationRate:.3f}%, rent={inputs.rentGrowthRate:.3f}%")
        try:
            from .ml.growth_model import (
                load_models,
                predict_zip_growth_with_fallback,
                get_zip_home_volatility,
            )
            
            # Store fallback rates (original percentage values)
            fallback_home = inputs.homeAppreciationRate
            fallback_rent = inputs.rentGrowthRate
            
            # Ensure models are loaded
            print(f"[ML DEBUG] Loading ML models...")
            load_models()
            print(f"[ML DEBUG] Models loaded successfully")
            
            # Convert fallback rates from percent to decimal for ML function
            fallback_home_decimal = fallback_home / 100.0
            fallback_rent_decimal = fallback_rent / 100.0
            print(f"[ML DEBUG] Calling predict_zip_growth_with_fallback with fallback: home={fallback_home_decimal:.6f}, rent={fallback_rent_decimal:.6f}")
            
            # Get ML predictions with fallback to similar ZIPs (returns as decimals, e.g., 0.03 = 3%)
            ml_home, ml_rent = predict_zip_growth_with_fallback(
                request.zipCode,
                fallback_home_rate=fallback_home_decimal,
                fallback_rent_rate=fallback_rent_decimal,
                k=10,  # Use 10 similar ZIPs for fallback
            )
            print(f"[ML DEBUG] Function returned: home={ml_home:.6f}, rent={ml_rent:.6f}")
            
            # Convert ML predictions from decimal to percentage
            # ML returns 0.03 (3%), calculator expects 3.0 (percentage)
            ml_home_pct = ml_home * 100.0
            ml_rent_pct = ml_rent * 100.0
            
            # Debug log (updated to mention fallback may have been used)
            print(
                f"[ML DEBUG] ZIP={request.zipCode} "
                f"fallback_home={fallback_home:.3f}%, fallback_rent={fallback_rent:.3f}% "
                f"-> ml_home={ml_home_pct:.3f}%, ml_rent={ml_rent_pct:.3f}% "
                f"(may include fallback to similar ZIPs if direct prediction unavailable)"
            )
            
            # Override rates with ML predictions
            homeAppreciationRate = ml_home_pct
            rentGrowthRate = ml_rent_pct
            
            # Create new inputs with ML-predicted rates
            inputs_dict = inputs.model_dump()
            inputs_dict['homeAppreciationRate'] = homeAppreciationRate
            inputs_dict['rentGrowthRate'] = rentGrowthRate
            inputs = type(inputs)(**inputs_dict)
            
            # Store ML-predicted rates for response
            ml_rates_used = {
                'home_appreciation_rate': homeAppreciationRate,
                'rent_growth_rate': rentGrowthRate
            }
        except Exception as e:
            # Debug log for errors
            print(f"[ML DEBUG] Error using ML growth model for ZIP={getattr(request, 'zipCode', None)}: {e}")
            # Log warning but continue with original rates
            import logging
            logging.warning(f"ML prediction failed for ZIP {request.zipCode}: {e}. Using original rates.")
            ml_rates_used = None
    
    analysis = calculate_unified_analysis(inputs)
    
    # Add the rates that were actually used to the response
    if ml_rates_used:
        analysis.home_appreciation_rate = ml_rates_used['home_appreciation_rate']
        analysis.rent_growth_rate = ml_rates_used['rent_growth_rate']
    else:
        # Use the rates from inputs (fallback rates)
        analysis.home_appreciation_rate = inputs.homeAppreciationRate
        analysis.rent_growth_rate = inputs.rentGrowthRate
    
    # Monte Carlo home price path simulation
    # Only run Monte Carlo if explicitly requested (it's computationally expensive)
    if request.includeMonteCarlo:
        print(f"[MC DEBUG] ========== Starting Monte Carlo Simulation ==========")
        try:
            from .finance.monte_carlo import simulate_home_price_paths, summarize_paths
            from .ml.growth_model import get_zip_home_volatility
            
            # Get the starting home value (same as used in projections)
            initial_price = inputs.homePrice
            print(f"[MC DEBUG] Initial price: ${initial_price:,.2f}")
            
            # Get the projection horizon in years (same as used in other charts)
            years = inputs.timeHorizonYears
            print(f"[MC DEBUG] Time horizon: {years} years")
            
            # Get the home appreciation rate in decimal form (already includes ML override if ZIP provided)
            home_appreciation_rate_pct = analysis.home_appreciation_rate
            mu = home_appreciation_rate_pct / 100.0
            print(f"[MC DEBUG] Home appreciation rate: {home_appreciation_rate_pct:.4f}% (mu={mu:.6f} decimal)")
            
            # Define fallback volatility (15% annual)
            fallback_sigma = 0.15
            
            # Get ZIP-specific volatility if ZIP code is provided
            if request.zipCode:
                print(f"[MC DEBUG] ZIP code provided: {request.zipCode}, looking up volatility...")
                sigma = get_zip_home_volatility(request.zipCode, fallback_sigma)
                print(f"[MC DEBUG] ZIP={request.zipCode} -> sigma={sigma:.4f} ({sigma*100:.2f}% annual volatility, fallback={fallback_sigma:.4f})")
            else:
                sigma = fallback_sigma
                print(f"[MC DEBUG] No ZIP code -> using fallback sigma={sigma:.4f} ({sigma*100:.2f}% annual volatility)")
            
            runs = request.monteCarloRuns or 150
            # Run Monte Carlo simulation
            print(f"[MC DEBUG] Running Monte Carlo simulation with {runs} paths...")
            paths = simulate_home_price_paths(
                initial_price=initial_price,
                annual_mu=mu,
                annual_sigma=sigma,
                years=years,
                n_paths=runs,
            )
            print(f"[MC DEBUG] Generated {len(paths)} price paths, each with {len(paths[0]) if paths else 0} time steps")
            
            # Summarize paths
            print(f"[MC DEBUG] Summarizing paths to compute percentiles...")
            summary = summarize_paths(paths)
            print(f"[MC DEBUG] Summary computed: {len(summary['years'])} years, p10/p50/p90 arrays all length {len(summary['p10'])}")
            
            # Show sample values
            if len(summary['years']) > 0:
                print(f"[MC DEBUG] Sample values (Year {summary['years'][0]}): p10=${summary['p10'][0]:,.2f}, p50=${summary['p50'][0]:,.2f}, p90=${summary['p90'][0]:,.2f}")
                if len(summary['years']) > 1:
                    final_idx = len(summary['years']) - 1
                    print(f"[MC DEBUG] Final values (Year {summary['years'][final_idx]}): p10=${summary['p10'][final_idx]:,.2f}, p50=${summary['p50'][final_idx]:,.2f}, p90=${summary['p90'][final_idx]:,.2f}")
            
            # Convert to Pydantic model
            analysis.monte_carlo_home_prices = HomePricePathSummary(
                years=summary["years"],
                p10=summary["p10"],
                p50=summary["p50"],
                p90=summary["p90"]
            )
            
            print(f"[MC DEBUG] ✅ Monte Carlo simulation complete and attached to analysis result")
            print(f"[MC DEBUG] ========== Monte Carlo Simulation Complete ==========")
        except Exception as e:
            # Log warning but don't break the analysis
            import logging
            import traceback
            logging.warning(f"Monte Carlo simulation failed: {e}. Continuing without Monte Carlo data.")
            print(f"[MC DEBUG] ❌ Error in Monte Carlo simulation: {e}")
            print(f"[MC DEBUG] Traceback: {traceback.format_exc()}")
            print(f"[MC DEBUG] ========== Monte Carlo Simulation Failed ==========")
            # Leave monte_carlo_home_prices as None (already default)
    else:
        print(f"[MC DEBUG] Monte Carlo simulation skipped (includeMonteCarlo=False)")
    
    return AnalysisResponse(analysis=analysis)


@app.post(f"{settings.api_prefix}/finance/heatmap")
def break_even_heatmap(req: HeatmapRequest) -> list:
    return calculate_heatmap(req.timelines, req.downPayments, req.base)

@app.post(f"{settings.api_prefix}/finance/scenarios")
def scenario_overlay_chart(req: ScenarioRequest) -> list:
    return calculate_scenarios(req.scenarios)

@app.post(f"{settings.api_prefix}/finance/sensitivity")
def sensitivity_chart(req: SensitivityRequest) -> list:
    return calculate_sensitivity(
        req.base,
        interest_rate_delta=req.interestRateDelta,
        home_price_delta=req.homePriceDelta,
        rent_delta=req.rentDelta
    )

@app.post(f"{settings.api_prefix}/finance/tax-savings")
def tax_savings(inputs: dict) -> list:
    # expects inputs matching ScenarioInputs + optional income/tax_bracket
    from .models import ScenarioInputs
    scenario = ScenarioInputs(**inputs)
    analysis = calculate_analysis(scenario)
    # Allow POST with optional income, tax_bracket
    income = inputs.get('income', 100000)
    bracket = inputs.get('taxBracket', 0.24)
    return calculate_tax_savings(scenario, analysis.monthlySnapshots, income, bracket)

@app.post(f"{settings.api_prefix}/finance/monte-carlo")
def monte_carlo_endpoint(req: MonteCarloRequest) -> dict:
    return calculate_monte_carlo(req.inputs, req.runs)


@app.post(f"{settings.api_prefix}/finance/chart-insight")
def chart_insight_endpoint(
    request: ChartInsightRequest, openai_service: OpenAIService = Depends(get_openai_service)
):
    """Generate a natural-language explanation for a specific chart + dataset (streaming)."""
    try:
        chart_payload = json.dumps(
            request.chartData,
            default=lambda obj: getattr(obj, "__dict__", str(obj)),
            ensure_ascii=False,
        )
    except (TypeError, ValueError):
        chart_payload = str(request.chartData)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a rent-vs-buy financial analyst helping someone new to home buying. "
                "Be concise—aim for 40-60 words maximum. "
                "CRITICAL: When the user says 'the chart shows X' or asks 'what does the chart show', they're referring to what they VISUALLY SEE. "
                "The chart may display calculated values (like differences between buy/rent, percentages, or derived metrics) that aren't directly in the raw dataset. "
                "If the user provides a specific number they see on the chart, ACKNOWLEDGE IT and explain it. Don't contradict what they're seeing. "
                "Calculate differences, percentages, or other derived values from the dataset when needed to match what the chart displays. "
                "When the user asks about a specific year or point, look at that exact data point and calculate any needed derived values. "
                "If the user corrects you, acknowledge it and recalculate based on what they're seeing. "
                "If the user expresses confusion, simplify: use fewer numbers, focus on concepts. "
                "Always use simple language. Be accurate and acknowledge what the user sees."
            ),
        },
    ]
    
    # Add conversation history if present
    if request.conversation:
        for msg in request.conversation:
            messages.append({
                "role": "user",
                "content": f"Question: {msg.question}",
            })
            messages.append({
                "role": "assistant",
                "content": msg.answer,
            })
    
    # Detect if user is confused
    question_lower = request.question.lower()
    is_confused = any(word in question_lower for word in ['lost', 'confused', "don't understand", "don't get", 'too many', 'overwhelming', 'complicated', 'hard to understand'])
    
    # Detect if user is correcting the AI or referring to what chart shows
    is_correction = any(word in question_lower for word in ['no,', 'actually', 'wrong', 'incorrect', 'that\'s not', "that's not", 'you said', 'but', 'the chart shows', 'chart says', 'chart displays'])
    
    # Add current question
    guidance = "Give a brief, clear answer (40-60 words max)."
    if is_confused:
        guidance += " The user is confused—simplify! Focus on the main concept, use minimal numbers, explain the big picture idea instead of specific figures."
    elif is_correction:
        guidance += " The user is telling you what they see on the chart or correcting you. ACKNOWLEDGE what they're seeing. Calculate differences or derived values from the dataset to match what the chart displays. Don't contradict them—explain what they're seeing."
    else:
        guidance += " Analyze the data. If the user asks what the chart shows, calculate any needed derived values (differences, percentages) to match the visual representation. Be accurate."
    
    messages.append({
        "role": "user",
        "content": (
            f"Chart Name: {request.chartName}\n"
            f"Dataset JSON: {chart_payload}\n"
            f"Question: {request.question}\n"
            f"{guidance}\n"
            "Remember: The chart may show calculated values (like differences between buy/rent). Calculate these from the dataset to match what the user sees visually."
        ),
    })

    def generate():
        try:
            for chunk in openai_service.chat_completion_stream(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.4,
                max_tokens=100,
            ):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@app.post(f"{settings.api_prefix}/finance/summary-insight", response_model=SummaryInsightResponse)
def summary_insight_endpoint(
    request: SummaryInsightRequest, openai_service: OpenAIService = Depends(get_openai_service)
) -> SummaryInsightResponse:
    """Generate a natural-language summary explaining the net worth comparison scenario."""
    try:
        # Build context for the prompt
        location_context = ""
        if request.zipCode:
            location_context = f" in ZIP code {request.zipCode}"
        
        break_even_text = ""
        if request.breakEvenYear:
            break_even_text = f"Buying becomes financially advantageous starting in year {request.breakEvenYear}. "
        else:
            break_even_text = "Within your time horizon, there is no clear break-even point where buying becomes financially advantageous. "
        
        winner_text = ""
        if request.finalDelta > 0:
            winner_text = f"By the end of your {request.timelineYears}-year timeline, buying puts you ahead by ${abs(request.finalDelta):,.0f} in net worth compared to renting."
        else:
            winner_text = f"By the end of your {request.timelineYears}-year timeline, renting puts you ahead by ${abs(request.finalDelta):,.0f} in net worth compared to buying."
        
        # Build the prompt
        prompt = f"""You are a friendly financial advisor explaining a rent-vs-buy analysis to someone considering purchasing a home{location_context}.

Based on the analysis results:
- Timeline: {request.timelineYears} years
- {break_even_text}
- {winner_text}
- Home appreciation rate: {request.homeAppreciationRate:.1f}% per year
- Rent growth rate: {request.rentGrowthRate:.1f}% per year

The net worth comparison chart shows how the buyer's and renter's net worth evolve over time. The buyer's line includes home equity buildup and appreciation, while the renter's line shows invested savings growth.

Write a clear, conversational 3-4 sentence summary that:
1. Explains what the chart shows in plain English
2. Mentions the break-even point (if applicable)
3. Highlights which option is better financially and by how much
4. Mentions the growth assumptions in a natural way

Keep it friendly, accessible, and avoid jargon. Write as if you're talking to a friend who's making a big decision."""

        response_text = openai_service.chat_completion(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful financial advisor who explains complex financial scenarios in simple, friendly language."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=300,
        )
        
        return SummaryInsightResponse(insight=response_text)
    except Exception as e:
        # Return a safe fallback message
        return SummaryInsightResponse(
            insight="Sorry, I couldn't generate a summary right now. Please try again."
        )


@app.post(f"{settings.api_prefix}/ai/chat")
def chat_completion(
    request: ChatRequest, openai_service: OpenAIService = Depends(get_openai_service)
) -> dict[str, str]:
    response_text = openai_service.chat_completion(
        model=request.model,
        messages=[message.model_dump() for message in request.messages],
        temperature=request.temperature,
        max_tokens=request.max_tokens,
    )
    return {"response": response_text}
