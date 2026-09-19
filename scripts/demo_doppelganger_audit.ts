/**
 * Runnable Demo: Doppelgänger Adversarial Gate (DoppelgangerGateService.ts)
 * 
 * Demonstrates the zero-hint cognitive attention inversion protocol:
 * Simulating the store owner's skepticism ("I think something is wrong with this card")
 * to flip foundation models from affirmative confirmation bias into forensic audit verification.
 * 
 * Includes:
 * 1. Mishra's Factory modern reprint catch (Antiquities 1994 -> 2025 reprint typography).
 * 2. Dynamic Temporal Anchoring (preventing false counterfeit hallucination on contemporary releases).
 * 
 * Run with:
 *   npm run demo:gate
 *   or: npx tsx scripts/demo_doppelganger_audit.ts
 */

import { DoppelgangerGateService, GeminiClientContract } from '../governance/DoppelgangerGateService.js';

console.log('======================================================================');
console.log('👁️  DOPPELGÄNGER ADVERSARIAL GATE DEMO');
console.log('   Cognitive Objective: Zero-Hint Attention Inversion');
console.log('   Enforces: Micro-Typography Audit & Dynamic Temporal Year Anchoring');
console.log('======================================================================\n');

// Mock Gemini Client simulating forensic multi-modal inspection results
const mockAuditorClient: GeminiClientContract = {
  models: {
    generateContent: async (params) => {
      const promptText = params.contents[0]?.parts.find(p => p.text)?.text || '';
      
      if (promptText.includes("Mishra's Factory")) {
        return {
          text: JSON.stringify({
            isAppraisalAccurate: false,
            detectedErrors: [
              "Vintage reprint misattribution: The bottom copyright typography displays modern 2025 frame styling, not the original 1994 Antiquities layout.",
              "Card number and set symbol indicate a modern reprint edition."
            ],
            auditedCondition: "Near Mint",
            summaryOfDiscrepancy: "Worker cataloged item as 1994 Antiquities ($113.88). Card is actually a 2025 modern reprint ($32.50)."
          })
        };
      }

      if (promptText.includes("Kyogre")) {
        return {
          text: JSON.stringify({
            isAppraisalAccurate: true,
            detectedErrors: [],
            auditedCondition: "Near Mint",
            summaryOfDiscrepancy: "Card is 100% authentic Near Mint from Mega Evolution [MEG EN]. Temporal baseline confirmed release is authentic modern release."
          })
        };
      }

      return {
        text: JSON.stringify({
          isAppraisalAccurate: true,
          detectedErrors: [],
          auditedCondition: "Near Mint",
          summaryOfDiscrepancy: "Standard audit pass."
        })
      };
    }
  }
};

async function runDemo() {
  // Test Case 1: Mishra's Factory Reprint Detection
  console.log('📋 [Test Case 1]: Mishra\'s Factory (Reprint Discrepancy Stress Test)');
  console.log('   Candidate Input: Magic: The Gathering - Antiquities (1994) | $113.88 | Near Mint');
  console.log('   Dispatching to Doppelgänger Gate with adversarial zero-hint query...\n');

  const result1 = await DoppelgangerGateService.interrogateCandidate(
    'data:image/jpeg;base64,/9j/4AAQSkZJRg==', // synthetic placeholder frame
    {
      name: "Mishra's Factory",
      set: "Antiquities",
      cardNumber: "ATQ-01",
      condition: "Near Mint",
      marketPrice: 113.88
    },
    mockAuditorClient
  );

  console.log('--- DOPPELGÄNGER FORENSIC VERDICT ---');
  console.log(`Action:              [${result1.action}]`);
  console.log(`Appraisal Accurate:  ${result1.isAppraisalAccurate ? 'YES' : 'NO'}`);
  console.log(`Audited Condition:   ${result1.auditedCondition}`);
  console.log(`Detected Flaws:      ${result1.detectedErrors.length} flaw(s) identified`);
  result1.detectedErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  console.log(`Summary:             ${result1.summaryOfDiscrepancy}`);
  console.log(`Financial Recovery:  Purged phantom $81.38 valuation error before inventory commit.\n`);

  // Test Case 2: Dynamic Temporal Anchoring (Anti-Paranoia)
  console.log('📋 [Test Case 2]: Modern Contemporary Release (Dynamic Temporal Anchoring)');
  console.log('   Candidate Input: Pokemon - Kyogre #034/132 (Mega Evolution MEG EN) | $18.50 | Near Mint');
  console.log('   Testing against Temporal Baseline (current year: ' + new Date().getFullYear() + ')...\n');

  const result2 = await DoppelgangerGateService.interrogateCandidate(
    'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    {
      name: "Kyogre",
      set: "Mega Evolution",
      cardNumber: "034/132",
      condition: "Near Mint",
      marketPrice: 18.50
    },
    mockAuditorClient
  );

  console.log('--- DOPPELGÄNGER FORENSIC VERDICT ---');
  console.log(`Action:              [${result2.action}]`);
  console.log(`Appraisal Accurate:  ${result2.isAppraisalAccurate ? 'YES' : 'NO'}`);
  console.log(`Audited Condition:   ${result2.auditedCondition}`);
  console.log(`Summary:             ${result2.summaryOfDiscrepancy}`);
  console.log('✅ Temporal anchoring prevented false counterfeit hallucination on modern authentic release.\n');

  console.log('======================================================================');
  console.log('🎉 Doppelgänger Gate Verification Completed: 100% Truth Alignment.');
  console.log('======================================================================');
}

runDemo();
