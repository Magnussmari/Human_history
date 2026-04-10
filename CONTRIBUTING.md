# Contributing to Human History

Thank you for helping build the most comprehensive structured chronicle of human civilization.

## Ways to Contribute

### Research new years
The daemon works from 2025 backward. You can research any year it hasn't reached yet.

1. Check `state/progress.json` for which years are done
2. Open an Issue with the `claim` label to reserve your range
3. Use the meta-prompt from the README or `RESEARCH_PROMPT.md` directly
4. Validate your JSON: `jq -e '.year and .events and .disconfirming_evidence' your_file.json`
5. Submit a PR adding your file to `outputs/json/`

### Validate existing years
Pick any completed year and check it for errors, bias, or missing events. Open an Issue tagged `correction`.

### Add regional expertise
If you have domain knowledge in non-Western history, your contributions are especially valuable. The daemon's training data has gaps — your expertise fills them.

### Adversarial review
Prove us wrong. Find hallucinations, biases, missing perspectives, or factual errors. Tag Issues with `adversarial`.

## JSON Schema Requirements

All year files must:
- Be valid JSON
- Have a top-level `year` field (integer)
- Have a `year_label` field (string, e.g., "1066 CE" or "3200 BCE")
- Have an `events` array (can be empty for poorly-documented years)
- Have a `disconfirming_evidence` field (never empty — state "none identified" if applicable)
- Have named sources on every event — "general knowledge" is not acceptable
- Have a certainty level on every event with justification

See `RESEARCH_PROMPT.md` for the full schema.

## PR Guidelines

- One PR per year or per small batch (max 10 years)
- Title format: `Add year [YEAR]` or `Correct year [YEAR]: [brief description]`
- Include a brief note on your methodology or sources
- Don't modify `RESEARCH_PROMPT.md` — it's the canonical prompt
- Don't modify other contributors' year files without opening a discussion first

## Code of Conduct

Be honest. Declare uncertainty. Don't fabricate. Credit your sources. Respect the scholarship of others. An empty events array is better than a fabricated one.
