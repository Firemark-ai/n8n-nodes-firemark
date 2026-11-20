# Changelog

## 0.1.0

- First release, read-only, with the Firemark API credential: Brand (Get Many), Result (Get), Prompt (Get), Run (Get Many), Answer (Get Many) and Digital PR (Get).
- Change (Get): what changed since a run that passed Firemark's rules, with its sentences. Since Run from a list of the brand's published runs or by ID; by default the run before the latest.
- Gap (Get Many), Source Gap (Get Many), Competitor (Get Many) and Engine (Get Many), one item per row with a Split Into Items switch, by prompt group, period or unbranded answers (and, for gaps, kind, engine, stages, competitor, run, runs, limit and cursor).
- Firemark Trigger: On New Run Published, polling a brand's run log, with Include Changes.
