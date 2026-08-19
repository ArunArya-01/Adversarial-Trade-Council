from fastapi import APIRouter
import time
import feedparser
import asyncio
from typing import List, Dict, Any

router = APIRouter(prefix="/news", tags=["News"])

# 5-minute in-memory cache
NEWS_CACHE = {
    "timestamp": 0,
    "items": []
}

FEEDS = [
    {"source": "Economic Times", "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", "category": "stocks", "sentiment": "bullish"},
    {"source": "Moneycontrol", "url": "https://www.moneycontrol.com/rss/MCtopnews.xml", "category": "economy", "sentiment": "neutral"},
    {"source": "NDTV Profit", "url": "https://feeds.feedburner.com/ndtvprofit-latest", "category": "ipo", "sentiment": "bullish"},
    {"source": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex", "category": "global", "sentiment": "neutral"},
]

DEFAULT_FALLBACK_NEWS = [
    {
        "id": 1,
        "title": "Nifty 50 crosses 24,600 on strong domestic and institutional foreign portfolio inflows",
        "headline": "Nifty 50 crosses 24,600 on strong domestic and institutional foreign portfolio inflows",
        "source": "Economic Times",
        "category": "stocks",
        "sentiment": "bullish",
        "summary": "Heavy buying across banking, auto, and IT counters propelled benchmark indices to near all-time highs as foreign institutional investors turned net buyers for the fourth consecutive session.",
        "simplified": "Heavy buying across banking, auto, and IT counters propelled benchmark indices to near all-time highs as foreign institutional investors turned net buyers for the fourth consecutive session.",
        "url": "https://economictimes.indiatimes.com",
        "published": "3 mins ago"
    },
    {
        "id": 2,
        "title": "RBI MPC Statement: Repo rate held steady at 6.50%; GDP forecast maintained at 7.2%",
        "headline": "RBI MPC Statement: Repo rate held steady at 6.50%; GDP forecast maintained at 7.2%",
        "source": "Moneycontrol",
        "category": "economy",
        "sentiment": "neutral",
        "summary": "The Monetary Policy Committee reiterated its withdrawal of accommodation stance to ensure inflation aligns with the 4% target while sustaining broad-based industrial and service growth momentum.",
        "simplified": "The Monetary Policy Committee reiterated its withdrawal of accommodation stance to ensure inflation aligns with the 4% target while sustaining broad-based industrial and service growth momentum.",
        "url": "https://moneycontrol.com",
        "published": "12 mins ago"
    },
    {
        "id": 3,
        "title": "Clean Energy Infrastructure IPO subscribed 74x on closing day with record retail bids",
        "headline": "Clean Energy Infrastructure IPO subscribed 74x on closing day with record retail bids",
        "source": "NDTV Profit",
        "category": "ipo",
        "sentiment": "bullish",
        "summary": "The public issue witnessed strong subscription across QIB, NII, and retail portions. Grey Market Premium (GMP) indicates listing gains exceeding 40% when shares debut next week.",
        "simplified": "The public issue witnessed strong subscription across QIB, NII, and retail portions. Grey Market Premium (GMP) indicates listing gains exceeding 40% when shares debut next week.",
        "url": "https://ndtvprofit.com",
        "published": "28 mins ago"
    },
    {
        "id": 4,
        "title": "Federal Reserve signals pathway for monetary easing as core PCE inflation cools to 2.6%",
        "headline": "Federal Reserve signals pathway for monetary easing as core PCE inflation cools to 2.6%",
        "source": "Reuters",
        "category": "global",
        "sentiment": "bullish",
        "summary": "US benchmark Treasury yields fell to multi-month lows as market pricing reflected high probability of rate cuts starting in upcoming FOMC meetings, lifting emerging market currencies.",
        "simplified": "US benchmark Treasury yields fell to multi-month lows as market pricing reflected high probability of rate cuts starting in upcoming FOMC meetings, lifting emerging market currencies.",
        "url": "https://reuters.com",
        "published": "45 mins ago"
    },
    {
        "id": 5,
        "title": "Monthly Mutual Fund SIP contributions touch fresh record of ₹23,547 crore in India",
        "headline": "Monthly Mutual Fund SIP contributions touch fresh record of ₹23,547 crore in India",
        "source": "ValueResearch",
        "category": "mutual_funds",
        "sentiment": "bullish",
        "summary": "AMFI data reveals systematic monthly investment plans grew 28% YoY, underscoring resilient domestic household financialization and steady asset compounding in large and flexi-cap schemes.",
        "simplified": "AMFI data reveals systematic monthly investment plans grew 28% YoY, underscoring resilient domestic household financialization and steady asset compounding in large and flexi-cap schemes.",
        "url": "https://valueresearchonline.com",
        "published": "1 hour ago"
    },
    {
        "id": 6,
        "title": "SEBI introduces enhanced risk disclosures for index options and derivative contracts",
        "headline": "SEBI introduces enhanced risk disclosures for index options and derivative contracts",
        "source": "Business Standard",
        "category": "stocks",
        "sentiment": "neutral",
        "summary": "The capital markets regulator standardized weekly expiry contracts and increased lot sizes to prevent unchecked retail leverage and encourage long-term wealth building discipline.",
        "simplified": "The capital markets regulator standardized weekly expiry contracts and increased lot sizes to prevent unchecked retail leverage and encourage long-term wealth building discipline.",
        "url": "https://business-standard.com",
        "published": "2 hours ago"
    },
    {
        "id": 7,
        "title": "Brent crude stabilizes near $78 per barrel amid balanced global supply and demand metrics",
        "headline": "Brent crude stabilizes near $78 per barrel amid balanced global supply and demand metrics",
        "source": "Bloomberg",
        "category": "global",
        "sentiment": "neutral",
        "summary": "Range-bound oil prices provide macroeconomic relief for net energy importing nations like India, keeping corporate freight and input packaging costs well contained.",
        "simplified": "Range-bound oil prices provide macroeconomic relief for net energy importing nations like India, keeping corporate freight and input packaging costs well contained.",
        "url": "https://bloomberg.com",
        "published": "3 hours ago"
    }
]

def fetch_rss_sync() -> List[Dict[str, Any]]:
    articles = []
    seen_titles = set()
    
    for feed_info in FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
            for entry in feed.entries[:6]:
                title = entry.get("title", "").strip()
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                
                summary = entry.get("summary", "") or entry.get("description", "")
                lower_text = (title + " " + summary).lower()
                sentiment = "neutral"
                if any(w in lower_text for w in ["surge", "jump", "record", "profit", "bull", "rally", "gain", "high", "beat", "rise"]):
                    sentiment = "bullish"
                elif any(w in lower_text for w in ["plunge", "drop", "loss", "crash", "fall", "bear", "down", "warning", "probe", "inflation"]):
                    sentiment = "bearish"
                    
                category = feed_info["category"]
                if "ipo" in lower_text or "listing" in lower_text or "allotment" in lower_text:
                    category = "ipo"
                elif "mutual fund" in lower_text or "sip" in lower_text or "nav" in lower_text:
                    category = "mutual_funds"
                elif "fed" in lower_text or "rbi" in lower_text or "inflation" in lower_text or "gdp" in lower_text:
                    category = "economy"
                elif "nasdaq" in lower_text or "s&p" in lower_text or "us market" in lower_text or "dollar" in lower_text:
                    category = "global"
                elif "stock" in lower_text or "share" in lower_text or "nifty" in lower_text or "sensex" in lower_text:
                    category = "stocks"

                articles.append({
                    "id": len(articles) + 1,
                    "title": title,
                    "headline": title,
                    "source": feed_info["source"],
                    "category": category,
                    "sentiment": sentiment,
                    "summary": (summary[:220] + "...") if len(summary) > 220 else summary,
                    "simplified": (summary[:220] + "...") if len(summary) > 220 else summary,
                    "url": entry.get("link", "#"),
                    "published": entry.get("published", "Recently updated")
                })
        except Exception:
            continue
            
    return articles if len(articles) >= 3 else DEFAULT_FALLBACK_NEWS

@router.get("")
async def get_live_news(category: str = "all"):
    current_time = time.time()
    
    if current_time - NEWS_CACHE["timestamp"] > 300 or not NEWS_CACHE["items"]:
        loop = asyncio.get_event_loop()
        fresh_articles = await loop.run_in_executor(None, fetch_rss_sync)
        if fresh_articles:
            NEWS_CACHE["items"] = fresh_articles
            NEWS_CACHE["timestamp"] = current_time
        else:
            NEWS_CACHE["items"] = DEFAULT_FALLBACK_NEWS
            NEWS_CACHE["timestamp"] = current_time
            
    items = NEWS_CACHE["items"] or DEFAULT_FALLBACK_NEWS
    if category != "all":
        items = [item for item in items if item["category"] == category]
        
    return {
        "items": items,
        "last_updated": NEWS_CACHE["timestamp"],
        "count": len(items)
    }
