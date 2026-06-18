# Drug Library

## Main Actions

1. Use the status filters to narrow reviewed, pending, seed, rejected, or controlled entries.
2. Use the local search box to match generic names, brand names, aliases, or mapped Chinese keywords.
3. Select a row to focus the drug and inspect its safety and FDA panels.
4. Use the plan column to keep per-dose logging or save a long-term template.

## Searching And Adding

- Local search runs against the embedded SQL registry first.
- If nothing local matches, the openFDA panel resolves aliases through the SQL mapping table before querying remote data.
- `Add as draft` creates a local draft entry that still requires review.

## Long-Term Templates

- `Per-dose` keeps manual logging only.
- `Long-term` stores reusable dose, route, interval, and formulation defaults.
- Templates are local-first and can be reused in the course tracker quick-add flow.

## History Actions

- `View history` jumps to the Course Tracker for the selected drug.
- `Delete history` removes medication logs for that drug only.
- Deleting history does not remove the registry row or the saved template.

## Search Tips

- Try the exact generic name first.
- Then try a brand name or known alias.
- For Chinese terms, make sure the alias exists in the SQL mapping table.
