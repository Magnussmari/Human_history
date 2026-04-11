#!/usr/bin/env python3
"""
Human History AI - Optimized API Client
Replaces claude CLI with direct API calls using tiered model strategy.
"""

import os
import json
import time
import hashlib
import asyncio
import aiohttp
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model pricing (per 1M tokens) - Anthropic as of April 2026
# State-of-the-art Claude 4.x series with 1M context windows
MODEL_PRICING = {
    "claude-haiku-4-5-20251001": {
        "input": 1.00,
        "output": 5.00,
        "cache_write": 1.25,
        "cache_read": 0.10,
        "context_window": 200000,
        "description": "Fastest, most affordable - good for well-documented modern years"
    },
    "claude-sonnet-4-6": {
        "input": 3.00,
        "output": 15.00,
        "cache_write": 3.75,
        "cache_read": 0.30,
        "context_window": 1000000,
        "description": "Best speed-to-intelligence ratio - 1M context window"
    },
    "claude-opus-4-6": {
        "input": 5.00,
        "output": 25.00,
        "cache_write": 6.25,
        "cache_read": 0.50,
        "context_window": 1000000,
        "description": "Most intelligent - best for ancient/complex years with 1M context"
    }
}

# Batch API pricing (50% discount)
BATCH_PRICING = {
    "claude-haiku-4-5-20251001": {"input": 0.50, "output": 2.50},
    "claude-sonnet-4-6": {"input": 1.50, "output": 7.50},
    "claude-opus-4-6": {"input": 2.50, "output": 12.50}
}

# Model strategy - Sonnet 4.6 for all years (Haiku quality insufficient for historical research)
DEFAULT_STRATEGY = {
    "modern_cutoff": 99999,     # Never use Haiku — Sonnet for everything
    "ancient_cutoff": -99999,   # Never use Opus — Sonnet for everything
    "default": "claude-sonnet-4-6",
    "fallback": "claude-sonnet-4-6",
    "ancient_model": "claude-sonnet-4-6"
}


@dataclass
class TokenUsage:
    """Track token usage for cost monitoring."""
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    timestamp: str
    year: int


class TokenTracker:
    """Track and report token usage across all requests."""
    
    def __init__(self, state_dir: Path):
        self.state_dir = state_dir
        self.usage_file = state_dir / "token_usage.json"
        self.usage_history: List[Dict] = []
        self._load_history()
    
    def _load_history(self):
        if self.usage_file.exists():
            try:
                with open(self.usage_file, 'r') as f:
                    self.usage_history = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load token history: {e}")
                self.usage_history = []
    
    def record(self, usage: TokenUsage):
        """Record token usage."""
        self.usage_history.append(asdict(usage))
        self._save()
    
    def _save(self):
        with open(self.usage_file, 'w') as f:
            json.dump(self.usage_history, f, indent=2)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive token usage statistics."""
        if not self.usage_history:
            return {"total_cost": 0, "total_requests": 0}
        
        total_cost = sum(u["cost_usd"] for u in self.usage_history)
        total_input = sum(u["input_tokens"] for u in self.usage_history)
        total_output = sum(u["output_tokens"] for u in self.usage_history)
        
        by_model = {}
        for u in self.usage_history:
            model = u["model"]
            if model not in by_model:
                by_model[model] = {"cost": 0, "requests": 0, "input": 0, "output": 0}
            by_model[model]["cost"] += u["cost_usd"]
            by_model[model]["requests"] += 1
            by_model[model]["input"] += u["input_tokens"]
            by_model[model]["output"] += u["output_tokens"]
        
        return {
            "total_cost_usd": round(total_cost, 4),
            "total_requests": len(self.usage_history),
            "total_input_tokens": total_input,
            "total_output_tokens": total_output,
            "by_model": by_model,
            "projected_cost_5226_years": round(total_cost / len(self.usage_history) * 5226, 2)
        }
    
    def print_report(self):
        """Print a formatted usage report."""
        stats = self.get_stats()
        print("\n" + "="*60)
        print("TOKEN USAGE REPORT")
        print("="*60)
        print(f"Total Requests: {stats['total_requests']}")
        print(f"Total Cost: ${stats['total_cost_usd']:.4f}")
        print(f"Projected Cost (5226 years): ${stats.get('projected_cost_5226_years', 0):.2f}")
        print("\nBy Model:")
        for model, data in stats.get("by_model", {}).items():
            print(f"  {model}:")
            print(f"    Requests: {data['requests']}")
            print(f"    Cost: ${data['cost']:.4f}")
            print(f"    Avg per request: ${data['cost']/data['requests']:.4f}")
        print("="*60 + "\n")


class ResponseCache:
    """Simple file-based cache for API responses."""
    
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_key(self, year: int, prompt: str, model: str) -> str:
        """Generate cache key from inputs."""
        content = f"{year}:{prompt}:{model}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def get(self, year: int, prompt: str, model: str) -> Optional[Dict]:
        """Get cached response if exists."""
        key = self._get_cache_key(year, prompt, model)
        cache_file = self.cache_dir / f"{year}_{key}.json"
        
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
        return None
    
    def set(self, year: int, prompt: str, model: str, response: Dict):
        """Cache a response."""
        key = self._get_cache_key(year, prompt, model)
        cache_file = self.cache_dir / f"{year}_{key}.json"
        
        try:
            with open(cache_file, 'w') as f:
                json.dump(response, f, indent=2)
        except Exception as e:
            logger.warning(f"Cache write error: {e}")


class OptimizedHistoryClient:
    """
    Optimized client for Human History AI research.
    Uses tiered model selection and direct API calls.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        state_dir: Optional[Path] = None,
        strategy: Optional[Dict] = None
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY required")
        
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.strategy = strategy or DEFAULT_STRATEGY
        
        # Setup state directories
        self.state_dir = state_dir or Path("/workspace/state")
        self.state_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize tracking
        self.token_tracker = TokenTracker(self.state_dir)
        self.cache = ResponseCache(self.state_dir / "cache")
        
        # Statistics
        self.requests_made = 0
        self.cache_hits = 0
    
    def select_model(self, year: int) -> str:
        """Select appropriate model based on year complexity - April 2026 strategy."""
        if year >= self.strategy["modern_cutoff"]:
            return self.strategy["default"]  # Haiku 4.5 for modern years (1950+)
        elif year <= self.strategy.get("ancient_cutoff", -1000):
            return self.strategy.get("ancient_model", "claude-opus-4-6")
        else:
            return self.strategy["fallback"]  # Sonnet 4.6 for middle periods
    
    def calculate_cost(
        self, 
        model: str, 
        input_tokens: int, 
        output_tokens: int,
        cache_write_tokens: int = 0,
        cache_read_tokens: int = 0,
        use_batch: bool = False
    ) -> float:
        """Calculate cost in USD with prompt caching support."""
        if use_batch and model in BATCH_PRICING:
            pricing = BATCH_PRICING[model]
            input_cost = (input_tokens / 1_000_000) * pricing["input"]
            output_cost = (output_tokens / 1_000_000) * pricing["output"]
        else:
            pricing = MODEL_PRICING.get(model, MODEL_PRICING["claude-sonnet-4-6"])
            input_cost = (input_tokens / 1_000_000) * pricing["input"]
            output_cost = (output_tokens / 1_000_000) * pricing["output"]
        
        # Add caching costs if applicable
        cache_cost = 0
        if cache_write_tokens > 0:
            cache_cost += (cache_write_tokens / 1_000_000) * pricing.get("cache_write", pricing["input"] * 1.25)
        if cache_read_tokens > 0:
            cache_cost += (cache_read_tokens / 1_000_000) * pricing.get("cache_read", pricing["input"] * 0.1)
        
        return input_cost + output_cost + cache_cost
    
    async def research_year(
        self,
        year: int,
        prompt: str,
        max_retries: int = 3,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Research a single year with optimized API calls.
        
        Args:
            year: The year to research
            prompt: The research prompt
            max_retries: Maximum retry attempts
            use_cache: Whether to use caching
        
        Returns:
            Dict with research results and metadata
        """
        model = self.select_model(year)
        
        # Check cache first
        if use_cache:
            cached = self.cache.get(year, prompt, model)
            if cached:
                self.cache_hits += 1
                logger.info(f"[{year}] Cache hit!")
                return {**cached, "cached": True}
        
        # Make API request with retries
        for attempt in range(max_retries):
            try:
                result = await self._call_api(year, prompt, model)
                
                # Cache successful result
                if use_cache:
                    self.cache.set(year, prompt, model, result)
                
                return result
                
            except Exception as e:
                logger.warning(f"[{year}] Attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"[{year}] Waiting {wait_time}s before retry...")
                    await asyncio.sleep(wait_time)
                else:
                    raise
        
        raise RuntimeError(f"All retries exhausted for year {year}")
    
    async def _call_api(
        self,
        year: int,
        prompt: str,
        model: str
    ) -> Dict[str, Any]:
        """Make a single API call to Anthropic."""
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": model,
            "max_tokens": 16384,
            "temperature": 0.2,  # Lower temperature for factual consistency
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=600)  # 10 min — large research prompts
            ) as response:
                
                if response.status == 429:
                    retry_after = int(response.headers.get("retry-after", 60))
                    logger.warning(f"[{year}] Rate limited. Waiting {retry_after}s...")
                    await asyncio.sleep(retry_after)
                    raise Exception("Rate limited")
                
                response.raise_for_status()
                data = await response.json()
                
                # Extract usage
                usage = data.get("usage", {})
                input_tokens = usage.get("input_tokens", 0)
                output_tokens = usage.get("output_tokens", 0)
                cost = self.calculate_cost(model, input_tokens, output_tokens)
                
                # Record usage
                token_usage = TokenUsage(
                    model=model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    cost_usd=cost,
                    timestamp=datetime.utcnow().isoformat(),
                    year=year
                )
                self.token_tracker.record(token_usage)
                
                self.requests_made += 1
                
                # Extract content
                content = data["content"][0]["text"] if data.get("content") else ""
                
                return {
                    "year": year,
                    "model": model,
                    "content": content,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "cost_usd": cost,
                    "cached": False
                }
    
    async def research_batch(
        self,
        years: List[int],
        prompt_template: str,
        max_concurrent: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Research multiple years with controlled concurrency.
        
        Args:
            years: List of years to research
            prompt_template: Template with {{YEAR}} placeholder
            max_concurrent: Maximum parallel requests
        
        Returns:
            List of research results
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def research_with_limit(year: int) -> Dict[str, Any]:
            async with semaphore:
                prompt = prompt_template.replace("{{YEAR}}", str(year))
                prompt = prompt.replace("{{YEAR_LABEL}}", self._format_year(year))
                
                try:
                    return await self.research_year(year, prompt)
                except Exception as e:
                    logger.error(f"[{year}] Failed: {e}")
                    return {
                        "year": year,
                        "error": str(e),
                        "content": None
                    }
        
        tasks = [research_with_limit(year) for year in years]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in results
        processed_results = []
        for year, result in zip(years, results):
            if isinstance(result, Exception):
                processed_results.append({
                    "year": year,
                    "error": str(result),
                    "content": None
                })
            else:
                processed_results.append(result)
        
        return processed_results
    
    def _format_year(self, year: int) -> str:
        """Format year for display."""
        if year < 0:
            return f"{abs(year)} BCE"
        return f"{year} CE"
    
    def print_stats(self):
        """Print usage statistics."""
        self.token_tracker.print_report()
        print(f"Cache hits: {self.cache_hits}")
        print(f"API requests: {self.requests_made}")


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Optimized Human History AI Client")
    parser.add_argument("--year", "-y", type=int, help="Single year to research")
    parser.add_argument("--start", "-s", type=int, default=2025, help="Start year")
    parser.add_argument("--end", "-e", type=int, default=2024, help="End year")
    parser.add_argument("--parallel", "-p", type=int, default=5, help="Parallel requests")
    parser.add_argument("--prompt-file", "-f", required=True, help="Prompt template file")
    parser.add_argument("--output-dir", "-o", default="./outputs", help="Output directory")
    parser.add_argument("--stats", action="store_true", help="Show stats and exit")
    
    args = parser.parse_args()
    
    client = OptimizedHistoryClient()
    
    if args.stats:
        client.print_stats()
        exit(0)
    
    # Load prompt template
    with open(args.prompt_file, 'r') as f:
        prompt_template = f.read()
    
    # Determine years to process
    if args.year:
        years = [args.year]
    else:
        years = list(range(args.start, args.end - 1, -1))
    
    print(f"Researching {len(years)} years with max {args.parallel} concurrent requests...")
    
    # Run research
    results = asyncio.run(client.research_batch(
        years=years,
        prompt_template=prompt_template,
        max_concurrent=args.parallel
    ))
    
    # Save results
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for result in results:
        year = result["year"]
        output_file = output_dir / f"{year}.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Saved: {output_file}")
    
    # Print final stats
    client.print_stats()
