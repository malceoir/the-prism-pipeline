# Truth Chapter: Engine Zero-Trust Governance
**Status:** Ratified by Tyler Lauzon (Architect)  
**Governing Subsystems:** Absolution, The Archivist, Quarantine Protocol

## Invariants
1. Anti-Spec Tampering: Worker agents are permanently forbidden from modifying truth chapters.
2. Line-by-Line Interrogation: Absolution audits worker code against The Truth before work is accepted or merged.
3. Silent Side-Channel Audit: The Archivist verifies initial inputs against final trade objects independently, ignoring worker self-reported flags.
4. Execution Quarantine: Blatant AI shortcuts trigger credential revocation and execution quarantine locks.
