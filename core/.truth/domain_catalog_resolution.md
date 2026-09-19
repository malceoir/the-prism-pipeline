# Truth Chapter: Domain Catalog Resolution
**Status:** Ratified by The Creator (Tyler Lauzon)  
**Governing Subsystems:** TCG Catalog Service, Pricing Engine, Multi-Finish Gate

## Invariants
1. Composite Key Resolution: Every trading card must map to `clean(name) + "_" + clean(set) + "_" + clean(cardNumber)`.
2. Multi-Subtype Market Pricing: Finishing variants (Normal, Foil, Holofoil, Reverse Holofoil) must query exact pricing partitions.
3. In-Flight Autonomous Healing: When minor OCR typos or punctuation mismatches occur, execute the 4-Stage Healing Protocol before resorting to external API fallbacks.
