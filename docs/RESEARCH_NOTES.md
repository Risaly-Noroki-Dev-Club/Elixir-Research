# Research Notes

## Reference App

Oyama's HRT Tracker is a useful product reference because it is privacy-first, local-storage based, and uses React + TypeScript + Vite. Its README says the HRT simulation runs in-browser and stores data in `localStorage`, and the repository uses a TypeScript-heavy Vite stack.

## Oxycodone / OxyContin Baseline

DailyMed's OXYCONTIN label states that OXYCONTIN is designed to deliver oxycodone over 12 hours, that tablets are taken every 12 hours, and that cutting/crushing/chewing breaks the controlled-release mechanism. The same label gives oral bioavailability of 60% to 87%, relative oral bioavailability of OXYCONTIN versus immediate-release forms as 100%, apparent half-life around 4.5 hours for OXYCONTIN, and dose-proportional Cmax/AUC across listed strengths.

Li et al. 2016 modeled immediate- and controlled-release oxycodone formulations and is directly relevant to our release-rate abstraction: PMID 26977300, DOI 10.1002/prp2.210, PMCID PMC4777261.

Ladebo et al. 2020 built population PK/PD models for liquid and controlled-release oxycodone in healthy volunteers. This is the most relevant next paper before replacing the demo two-input model with a better population model: PMID 31597014, DOI 10.1111/bcpt.13330.

Kalso 2005 is an older oxycodone clinical review that can help with broad PK/PD context but should not be the only source for controlled-release implementation: PMID 15907646, DOI 10.1016/j.jpainsymman.2005.01.010.

## Modeling Implications

- Do not model OxyContin-like products as a single immediate-release curve.
- Start with two-input absorption and keep the formulation profile replaceable.
- Treat apparent therapeutic windows for opioids as research-only unless a clinician-reviewed source defines them.
- Interactions with CNS depressants, alcohol, CYP3A4 inhibitors/inducers, and MAOIs need hard warning states before any general release.

## Sources to Keep Nearby

- Oyama's HRT Tracker README and package metadata
- DailyMed OXYCONTIN label
- openFDA Drug Label API docs
- Netlify Vite and Functions docs
- Li Y. et al. 2016 controlled-release oxycodone formulation modeling
- Ladebo L. et al. 2020 controlled-release oxycodone population PK/PD modeling
