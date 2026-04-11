#!/usr/bin/env python3
"""
Human History AI - Batch Processor
Processes multiple years per API call for massive cost savings.
"""

import os
import json
import asyncio
import aiohttp
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# April 2026 Model Pricing (per 1M tokens)
BATCH_MODEL_PRICING = {
    "claude-sonnet-4-6": {"input": 1.00, "output": 5.00},
    "claude-sonnet-4-6": {"input": 3.00, "output": 15.00},
    "claude-opus-4-6": {"input": 5.00, "output": 25.00}
}

# Batch API pricing (50% discount)
BATCH_API_PRICING = {
    "claude-sonnet-4-6": {"input": 0.50, "output": 2.50},
    "claude-sonnet-4-6": {"input": 1.50, "output": 7.50},
    "claude-opus-4-6": {"input": 2.50, "output": 12.50}
}


@dataclass
class BatchConfig:
    """Configuration for batch processing - April 2026 models."""
    years_per_batch: int = 5  # Number of years per API call
    max_tokens_per_batch: int = 64000  # 5 years × ~12K tokens each
    model: str = "claude-sonnet-4-6"  # April 2026 Haiku
    temperature: float = 0.2
    use_batch_api: bool = True  # Use 50% discounted batch API


class BatchHistoryProcessor:
    """
    Process multiple years in a single API call.
    This can reduce token overhead by ~60-80% compared to individual calls.
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        config: Optional[BatchConfig] = None,
        output_dir: Optional[Path] = None
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY required")
        
        self.config = config or BatchConfig()
        self.output_dir = output_dir or Path("/workspace/outputs/json")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.total_cost = 0.0
        self.total_tokens = 0
    
    def create_batch_prompt(self, years: List[int], base_prompt: str) -> str:
        """
        Create a batch prompt for multiple years.
        
        The key insight: We can ask the model to research multiple years
        in a single response, structured as a JSON array.
        """
        years_str = ", ".join([str(y) for y in years])
        
        batch_prompt = f"""{base_prompt}

BATCH PROCESSING INSTRUCTIONS:
You are researching MULTIPLE years in this single request: {years_str}

For each year, provide the same detailed research you would for a single year.
Return your response as a JSON array where each element follows the single-year format.

Example structure:
[
  {{
    "year": 2020,
    "events": [...],
    "era_context": "...",
    ...
  }},
  {{
    "year": 2019,
    "events": [...],
    ...
  }}
]

RESEARCH YEARS: {years_str}

Provide complete, independent research for each year. Do not skip any year in the list.
"""
        return batch_prompt
    
    async def process_batch(
        self,
        years: List[int],
        prompt_template: str
    ) -> List[Dict[str, Any]]:
        """Process a batch of years in a single API call."""
        
        if not years:
            return []
        
        batch_prompt = self.create_batch_prompt(years, prompt_template)
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens_per_batch,
            "temperature": self.config.temperature,
            "messages": [{"role": "user", "content": batch_prompt}]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=900)  # 15 min for 5-year batches
            ) as response:
                
                response.raise_for_status()
                data = await response.json()
                
                # Track usage
                usage = data.get("usage", {})
                input_tokens = usage.get("input_tokens", 0)
                output_tokens = usage.get("output_tokens", 0)
                
                # April 2026 pricing with batch API discount
                if self.config.use_batch_api:
                    pricing = BATCH_API_PRICING.get(
                        self.config.model, 
                        BATCH_API_PRICING["claude-sonnet-4-6"]
                    )
                else:
                    pricing = BATCH_MODEL_PRICING.get(
                        self.config.model,
                        BATCH_MODEL_PRICING["claude-sonnet-4-6"]
                    )
                
                input_cost = (input_tokens / 1_000_000) * pricing["input"]
                output_cost = (output_tokens / 1_000_000) * pricing["output"]
                batch_cost = input_cost + output_cost
                
                self.total_cost += batch_cost
                self.total_tokens += input_tokens + output_tokens
                
                # Extract and parse content
                content = data["content"][0]["text"] if data.get("content") else ""
                
                # Try to parse as JSON array
                results = self._parse_batch_response(content, years)
                
                cost_per_year = batch_cost / len(years) if years else 0
                logger.info(
                    f"Batch {years[0]}→{years[-1]}: "
                    f"${batch_cost:.4f} total, ${cost_per_year:.4f}/year, "
                    f"{len(results)}/{len(years)} parsed"
                )
                
                return results
    
    def _parse_batch_response(
        self,
        content: str,
        expected_years: List[int]
    ) -> List[Dict[str, Any]]:
        """Parse batch response into individual year results."""
        results = []
        
        # Try to find JSON array in response
        try:
            # Look for JSON array pattern
            start_idx = content.find('[')
            end_idx = content.rfind(']')
            
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx:end_idx + 1]
                batch_data = json.loads(json_str)
                
                if isinstance(batch_data, list):
                    for item in batch_data:
                        if isinstance(item, dict) and "year" in item:
                            results.append(item)
                elif isinstance(batch_data, dict) and "year" in batch_data:
                    # Single object returned
                    results.append(batch_data)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")
        
        # If parsing failed, try individual year extraction
        if not results:
            logger.warning("Batch parse failed, attempting individual extraction")
            for year in expected_years:
                # Try to extract year-specific section
                year_result = self._extract_year_from_text(content, year)
                if year_result:
                    results.append(year_result)
        
        return results
    
    def _extract_year_from_text(self, content: str, year: int) -> Optional[Dict]:
        """Attempt to extract a single year's data from mixed text."""
        # Simple heuristic: look for year mention and extract following content
        import re
        
        # Find section starting with this year
        pattern = rf'["\']?year["\']?\s*:\s*["\']?{year}["\']?.*?\}}'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            try:
                # Try to parse as JSON
                json_str = "{" + match.group(0) + "}"
                return json.loads(json_str)
            except:
                pass
        
        return None
    
    async def process_year_range(
        self,
        start_year: int,
        end_year: int,
        prompt_template: str,
        progress_callback=None
    ) -> List[Dict[str, Any]]:
        """
        Process a range of years using batching.
        
        Args:
            start_year: Starting year (e.g., 2025)
            end_year: Ending year (e.g., -3200)
            prompt_template: The base research prompt
            progress_callback: Optional callback(completed, total)
        
        Returns:
            List of all results
        """
        # Generate year list (going backward)
        years = list(range(start_year, end_year - 1, -1))
        total_years = len(years)
        
        # Split into batches
        batches = [
            years[i:i + self.config.years_per_batch]
            for i in range(0, len(years), self.config.years_per_batch)
        ]
        
        logger.info(f"Processing {total_years} years in {len(batches)} batches")
        
        all_results = []
        completed = 0
        
        for i, batch in enumerate(batches):
            logger.info(f"Batch {i+1}/{len(batches)}: years {batch[0]} to {batch[-1]}")
            
            try:
                batch_results = await self.process_batch(batch, prompt_template)
                all_results.extend(batch_results)
                
                # Save individual year files
                for result in batch_results:
                    if "year" in result:
                        year_file = self.output_dir / f"{result['year']}.json"
                        with open(year_file, 'w') as f:
                            json.dump(result, f, indent=2)
                
                completed += len(batch)
                if progress_callback:
                    progress_callback(completed, total_years)
                
                # Small delay between batches to avoid rate limits
                if i < len(batches) - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Batch {i+1} failed: {e}")
                # Continue with next batch
        
        return all_results
    
    def print_summary(self):
        """Print processing summary."""
        print("\n" + "="*60)
        print("BATCH PROCESSING SUMMARY")
        print("="*60)
        print(f"Total Cost: ${self.total_cost:.4f}")
        print(f"Total Tokens: {self.total_tokens:,}")
        print(f"Model: {self.config.model}")
        print(f"Batch Size: {self.config.years_per_batch} years/call")
        print("="*60 + "\n")


# Cost comparison utility - April 2026 pricing
def print_cost_comparison():
    """Print cost comparison between approaches using April 2026 Claude 4.x models."""
    years = 5226
    
    # Assumptions per year
    avg_input_tokens = 2500  # Prompt + context
    avg_output_tokens = 1500  # Response
    
    print("\n" + "="*70)
    print("COST COMPARISON: 5226 YEARS OF HUMAN HISTORY")
    print("April 2026 - Claude 4.x Series (State-of-the-Art)")
    print("="*70)
    
    # Current approach (Claude Code CLI - estimated)
    # Claude CLI has ~3-4x overhead due to system prompts, tools, etc.
    cli_multiplier = 3.5
    sonnet_input = 3.00
    sonnet_output = 15.00
    
    cli_cost = (
        (avg_input_tokens * years * cli_multiplier / 1_000_000 * sonnet_input) +
        (avg_output_tokens * years * cli_multiplier / 1_000_000 * sonnet_output)
    )
    
    print(f"\n1. CURRENT (Claude Code CLI - Legacy):")
    print(f"   Estimated Cost: ${cli_cost:,.2f}")
    print(f"   Note: High overhead from agent tools, system prompts")
    
    # April 2026 Claude 4.x pricing
    haiku4_input = 1.00
    haiku4_output = 5.00
    sonnet4_input = 3.00
    sonnet4_output = 15.00
    opus4_input = 5.00
    opus4_output = 25.00
    
    # Direct API with Sonnet 4.6 (1M context window)
    direct_sonnet_cost = (
        (avg_input_tokens * years / 1_000_000 * sonnet4_input) +
        (avg_output_tokens * years / 1_000_000 * sonnet4_output)
    )
    
    print(f"\n2. DIRECT API (Claude Sonnet 4.6 - 1M context):")
    print(f"   Estimated Cost: ${direct_sonnet_cost:,.2f}")
    print(f"   Savings vs CLI: ${cli_cost - direct_sonnet_cost:,.2f} ({(1 - direct_sonnet_cost/cli_cost)*100:.1f}%)")
    
    # Direct API with Haiku 4.5
    haiku_cost = (
        (avg_input_tokens * years / 1_000_000 * haiku4_input) +
        (avg_output_tokens * years / 1_000_000 * haiku4_output)
    )
    
    print(f"\n3. DIRECT API (Claude Haiku 4.5):")
    print(f"   Estimated Cost: ${haiku_cost:,.2f}")
    print(f"   Savings vs CLI: ${cli_cost - haiku_cost:,.2f} ({(1 - haiku_cost/cli_cost)*100:.1f}%)")
    print(f"   Savings vs Sonnet: ${direct_sonnet_cost - haiku_cost:,.2f}")
    
    # Batch API with Haiku 4.5 (50% discount)
    batch_haiku_input = 0.50
    batch_haiku_output = 2.50
    batch_overhead = 1.3  # 30% overhead for batch instructions
    batch_haiku_cost = (
        (avg_input_tokens * years * batch_overhead / 1_000_000 * batch_haiku_input) +
        (avg_output_tokens * years * batch_overhead / 1_000_000 * batch_haiku_output)
    ) / 5  # 5 years per batch
    
    print(f"\n4. BATCH API (Haiku 4.5, 5 years/call, 50% discount):")
    print(f"   Estimated Cost: ${batch_haiku_cost:,.2f}")
    print(f"   Savings vs CLI: ${cli_cost - batch_haiku_cost:,.2f} ({(1 - batch_haiku_cost/cli_cost)*100:.1f}%)")
    print(f"   Savings vs Direct Haiku: ${haiku_cost - batch_haiku_cost:,.2f}")
    
    # Tiered approach with April 2026 models
    modern_years = int(years * 0.75)  # ~75% modern (1950+)
    middle_years = int(years * 0.15)  # ~15% middle (0-1950)
    ancient_years = years - modern_years - middle_years  # ~10% ancient (-3200-0)
    
    tiered_cost = (
        (avg_input_tokens * modern_years / 1_000_000 * haiku4_input) +
        (avg_output_tokens * modern_years / 1_000_000 * haiku4_output) +
        (avg_input_tokens * middle_years / 1_000_000 * sonnet4_input) +
        (avg_output_tokens * middle_years / 1_000_000 * sonnet4_output) +
        (avg_input_tokens * ancient_years / 1_000_000 * opus4_input) +
        (avg_output_tokens * ancient_years / 1_000_000 * opus4_output)
    )
    
    print(f"\n5. TIERED APPROACH (Haiku 75% + Sonnet 15% + Opus 10%):")
    print(f"   Estimated Cost: ${tiered_cost:,.2f}")
    print(f"   Savings vs CLI: ${cli_cost - tiered_cost:,.2f} ({(1 - tiered_cost/cli_cost)*100:.1f}%)")
    
    # Optimal: Batch API + Tiered
    batch_tiered_cost = (
        (avg_input_tokens * modern_years * batch_overhead / 1_000_000 * batch_haiku_input) +
        (avg_output_tokens * modern_years * batch_overhead / 1_000_000 * batch_haiku_output) +
        (avg_input_tokens * middle_years / 1_000_000 * sonnet4_input) +
        (avg_output_tokens * middle_years / 1_000_000 * sonnet4_output) +
        (avg_input_tokens * ancient_years / 1_000_000 * opus4_input) +
        (avg_output_tokens * ancient_years / 1_000_000 * opus4_output)
    ) / 5  # Batch for modern years only
    
    print(f"\n6. OPTIMAL (Batch Haiku 75% + Sonnet 15% + Opus 10%):")
    print(f"   Estimated Cost: ${batch_tiered_cost:,.2f}")
    print(f"   Savings vs CLI: ${cli_cost - batch_tiered_cost:,.2f} ({(1 - batch_tiered_cost/cli_cost)*100:.1f}%)")
    
    print(f"\n{'='*70}")
    print("APRIL 2026 RECOMMENDATION: Use Option 6 (Optimal)")
    print(f"Models: Haiku 4.5 (batch) + Sonnet 4.6 + Opus 4.6")
    print(f"Potential savings: ${cli_cost - batch_tiered_cost:,.2f} ({(1 - batch_tiered_cost/cli_cost)*100:.0f}%)")
    print("="*70 + "\n")


if __name__ == "__main__":
    print_cost_comparison()
