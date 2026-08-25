from fastapi import APIRouter
from typing import List, Dict, Any, Optional
import math
import random

router = APIRouter(prefix="/practice", tags=["Practice"])

# ── Profiles with distinct realistic market movements ──
PROFILES = {
    "HDFCBANK": {
        "trend": "downtrend",
        "base_price": 1680.0,
        "marketBehavior": "📉 Clear Downtrend / Distribution (Dominant Red Candles)",
        "context": "HDFC Bank in sustained downtrend with aggressive selling pressure. Red candles dominate with lower highs and lower lows breaking support."
    },
    "TATAMOTORS": {
        "trend": "cyclical",
        "base_price": 970.0,
        "marketBehavior": "🌊 Cyclical Waves (Alternating Red Dips & Green Rallies)",
        "context": "Tata Motors moves in natural waves — green rallies followed by red pullbacks bouncing from institutional moving averages."
    },
    "RELIANCE": {
        "trend": "sideways",
        "base_price": 2960.0,
        "marketBehavior": "↔️ Sideways Range Channel (Equal Green & Red Candles)",
        "context": "Reliance oscillating inside a horizontal trading box between support and resistance."
    },
    "ZOMATO": {
        "trend": "uptrend",
        "base_price": 240.0,
        "marketBehavior": "🚀 Strong Uptrend (Dominant Green Breakout Candles)",
        "context": "Zomato institutional momentum with strong green impulse candles and brief red consolidation pauses."
    },
    "INFY": {
        "trend": "breakout",
        "base_price": 1460.0,
        "marketBehavior": "⚡ Base Consolidation into Green Breakout",
        "context": "Consolidates in a tight range before surging in consecutive green candles on heavy volume."
    },
    "AAPL": {
        "trend": "compounder",
        "base_price": 178.0,
        "marketBehavior": "📈 Steady Bull Trend with Healthy Pullbacks",
        "context": "Apple moving in institutional step-ups with green candles leading the trend."
    },
    "NVDA": {
        "trend": "uptrend",
        "base_price": 115.0,
        "marketBehavior": "🚀 Hyper-Growth Momentum (Strong Green Waves)",
        "context": "Nvidia massive momentum with explosive green volume bars and shallow red pullbacks."
    }
}

@router.get("/candles")
def get_candles(symbol: str, timeframe: str = "1D"):
    sym_clean = symbol.upper().replace(".NS", "")
    profile = PROFILES.get(sym_clean, {
        "trend": "sideways",
        "base_price": 1000.0,
        "marketBehavior": "Dynamic Real Market Structure",
        "context": "Simulated multi-regime candle stream."
    })
    
    trend = profile["trend"]
    base = profile["base_price"]
    length = 50
    candles = []
    
    # Starting price adjustments
    current = base
    if timeframe in ["1Y", "5Y"]:
        if trend == "downtrend":
            current = base * 1.35
        elif trend == "uptrend":
            current = base * 0.65
        else:
            current = base * 0.90
            
    # Deterministic pseudo-random seed based on symbol + timeframe
    seed_val = sum(ord(c) for c in (sym_clean + timeframe))
    random.seed(seed_val)
    
    for i in range(length):
        # Calculate realistic step delta with mixed green and red candles
        noise = (random.random() - 0.48) * 1.5
        
        if trend == "downtrend":
            # Downward slope: 65% red candles, 35% green bounce candles
            bias = -0.32 + math.sin(i * 0.4) * 0.25
        elif trend == "uptrend":
            # Upward slope: 65% green candles, 35% red pullback candles
            bias = 0.35 + math.sin(i * 0.35) * 0.20
        elif trend == "cyclical":
            # Oscillating waves
            bias = math.sin(i * 0.38) * 0.70
        elif trend == "breakout":
            bias = (math.sin(i * 0.5) * 0.15) if i < 26 else (0.55 + math.sin(i * 0.3) * 0.2)
        else: # sideways
            bias = math.sin(i * 0.45) * 0.50
            
        step_pct = (bias + noise) * 0.008
        open_p = round(current, 2)
        close_p = round(max(5.0, current * (1 + step_pct)), 2)
        
        # High and Low wicks
        wick_high = abs(random.random()) * current * 0.006 + max(open_p, close_p)
        wick_low = min(open_p, close_p) - abs(random.random()) * current * 0.006
        high_p = round(max(open_p, close_p, wick_high), 2)
        low_p = round(max(1.0, min(open_p, close_p, wick_low)), 2)
        
        # Volume: larger volume on impulse moves
        is_green = close_p >= open_p
        vol_base = 45000 if is_green else 40000
        vol = int(vol_base + abs(step_pct) * 2000000 + random.randint(5000, 30000))
        
        # Time string
        if timeframe == "1D":
            h = 9 + (i * 7) // 60
            m = (i * 7) % 60
            t_str = f"{str(h).zfill(2)}:{str(m).zfill(2)}"
        elif timeframe == "1W":
            t_str = f"Day {math.floor(i / 7) + 1} {10 + (i % 7)}:00"
        elif timeframe == "1M":
            t_str = f"Day {i + 1}"
        elif timeframe == "1Y":
            t_str = f"Wk {i + 1}"
        elif timeframe == "5Y":
            t_str = f"M{(i % 12) + 1} '2{math.floor(i / 12)}"
        else:
            t_str = f"Q{(i % 4) + 1} '1{8 + math.floor(i / 4)}"
            
        candles.append({
            "time": t_str,
            "open": open_p,
            "high": high_p,
            "low": low_p,
            "close": close_p,
            "volume": vol,
            "is_green": is_green
        })
        current = close_p
        
    return {
        "symbol": sym_clean,
        "timeframe": timeframe,
        "trend_type": trend,
        "marketBehavior": profile["marketBehavior"],
        "context": profile["context"],
        "candles": candles
    }
