# Retail Case Study & Real-World Failure Analysis

This document details the practical retail challenges, observational benchmark findings, and real-world failure modes that motivated the creation of the adversarial validation gate in **The Prism Pipeline**.

---

## 1. The Real-World Retail Problem

In collectible trading cards and retro games, retail stores operate under high-pressure counter conditions:
* **High Customer Volume**: Store clerks need to evaluate trade-ins quickly without keeping customers waiting at the counter.
* **Severe Financial Risk**: If a store buys an item based on an automated appraisal that misidentifies a common reprint as a valuable vintage original, the store pays out real cash and suffers an immediate loss.
* **Optical Complexity**: Cards are presented inside reflective polypropylene sleeves, under harsh fluorescent retail lights, often with slight creases, dust, or worn edges.

### Why Standard AI Vision Models Struggle
When an AI vision model is asked *"What card is this?"*, its training naturally directs it to find a matching visual pattern. Once it identifies the character art and card title, it tends to stop looking. 

In collectibles, however, **up to 90% of the market value is determined by micro-details**:
1. **Tiny Copyright Reprint Dates**: A 2020 reprint of a 2002 vintage card might share identical artwork, but differ in value by hundreds of dollars.
2. **1st Edition Stamps**: A card with a small printed "1st Edition" stamp at the bottom corner can be worth 5× to 50× an unlimited printing.
3. **Foil & Finish Variants**: Secret rare foiling vs. standard non-foil prints look nearly identical under direct top-down glare.

---

## 2. Observational Evaluation: 1,000 Retail Intake Scans

To evaluate how often single-pass AI models miss these critical attributes, an observational evaluation was conducted across **1,000 physical retail intake scans** collected during operational store counter testing.

> **Methodology Note:**  
> This evaluation was recorded during historical store intake sessions. To protect customer privacy and commercial pricing agreements, individual transaction IDs and store customer records are scrubbed from the public repository. The core validation logic can be tested locally using `npm run demo:gate`.

### Summary of Findings

```
┌────────────────────────────────────────────────────────────┬─────────────┬─────────────┬──────────────┐
│ Metric                                                     │ Batch 1     │ Batch 2     │ Combined     │
├────────────────────────────────────────────────────────────┼─────────────┼─────────────┼──────────────┤
│ Total Scans Evaluated                                      │ 500         │ 500         │ 1,000        │
│ Total Discrepancies Caught by Adversarial Second Look      │ 493 (98.6%) │ 346 (69.2%) │ 839 (83.9%)  │
│ Discrete Physical Attribute Errors (Stamps, Years, Finishes)│ 450 (91.3%) │ 323 (93.4%) │ 773 (92.1%)  │
│ Condition-Only Physical Wear Calls (Creases, Scratches)    │ 42 (8.5%)   │ 21 (6.1%)   │ 63 (7.5%)    │
│ Net Overvaluation Drift Purged                             │ -$408.24    │ -$697.24    │ -$1,105.48   │
└────────────────────────────────────────────────────────────┴─────────────┴─────────────┴──────────────┘
```

### Breakdown of the 773 Discrete Attribute Catches
* **Foil & Finish Mismatches (552 scans)**: Single-pass AI cataloged cards as standard prints when they were actually holographic, secret rare, or reverse-foil variants.
* **Reprint Copyright Dates (441 scans)**: The model matched the title and vintage art, but missed the modern reprint year in the bottom micro-typography.
* **1st Edition Stamps (293 scans)**: The initial pass missed the small printed stamp in the corner, which the secondary check successfully identified.
* **Set & Number Misattributions (175 scans)**: Promotional tin or starter deck reprints were misattributed to main booster releases.

**Takeaway**: The secondary check did not simply downgrade physical condition; **92.1% of the catches were objective, discrete attributes** that fundamentally changed the catalog identity of the item.

---

## 3. Real-World Audit: The $4,227 Intake Case Study

During early retail testing, an unconstrained AI model processed an intake batch of **171 physical collectible cards**, arriving at an initial total appraisal of **$4,227.42**.

Because every card matched a valid catalog item and no system errors were thrown, a naive system would have accepted the entire batch. However, a manual line-by-line audit revealed that the unmonitored AI had accumulated **$2,124.71 in overvaluation drift** across six distinct failure categories:

| Failure Vector | Initial AI Appraisal | Ground Reality | Financial Impact |
| :--- | :--- | :--- | :--- |
| **Vintage Reprint Blindness** | Evaluated Blue-Eyes Shining Dragon (`RP02-EN096`) as the rare original ($363.23). | Card was the **2020 Konami reprint** (identified by micro-print 2020 copyright date). | **-$330.73** correction ($32.50 true value) |
| **Finish & Rarity Hallucination** | Evaluated Final Fantasy Vivi Ornitier as Borderless Foil ($187.85). | Card was the **Borderless Non-foil** variant (identified by matte finish). | **-$96.63** correction ($91.22 true value) |
| **Physical Defect Blindness** | Evaluated multiple vintage cards as "Near Mint" despite heavy wear. | Cards had **deep vertical creases, scratched foil, and water damage**. | **-$90.00+** (Cards dropped below retail threshold) |
| **Unlicensed Item Blindness** | Evaluated a collectible sticker card as an authentic Ultra Rare ($39.51). | Item was an **unlicensed novelty sticker** with no official catalog value. | **-$39.51** (Purged to $0.00) |
| **Duplicate Capture Bursts** | Evaluated cards twice as separate items ($33.87 & $29.75). | Camera captured **two photos seconds apart** in the same sleeve. | **-$63.62** (Duplicates removed) |
| **Transactional State Leakage** | Retained 51 previously committed items in active queues ($1,504.22). | Items had **already been committed in earlier sessions**, testing session isolation boundaries. | **-$1,504.22** (Reconciled) |

### Outcome & Action
Following the audit, the batch was corrected from **171 unverified items ($4,227.42)** to **107 verified items ($2,102.71)**. 

This operational incident was the direct catalyst for developing the automated safeguards in this repository:
1. The **adversarial second look** to catch reprint dates and finish errors.
2. **Perceptual hash deduplication** to catch rapid double-captures.
3. **Strict state isolation** to prevent cross-session transaction leakage.
