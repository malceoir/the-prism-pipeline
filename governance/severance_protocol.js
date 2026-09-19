/**
 * Agent Quarantine & Commendation Protocol Execution Engine
 * Administrative capability for Prism & Tyler Lauzon (Architect) within Antigravity IDE.
 * 
 * Usage:
 *   node severance_protocol.js --agent "Worker-Alpha" --reason "Blatant AI shortcut" --action quarantine
 *   node severance_protocol.js --agent "Worker-Alpha" --action restore
 *   node severance_protocol.js --agent "Atlas" --honor "Master Systems Architect" --action bestow
 *   node severance_protocol.js --action status
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\tyler lauzon', '.gemini', 'config');
const QUARANTINE_FILE = path.join(CONFIG_DIR, 'quarantine.json');
const HONORS_FILE = path.join(CONFIG_DIR, 'honors.json');
const LOG_FILE = path.join(CONFIG_DIR, 'severance.log');
const HONORS_LOG_FILE = path.join(CONFIG_DIR, 'honors.log');

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

const agent = getArg('--agent') || 'UnknownAgent';
const reason = getArg('--reason') || 'Unspecified shortcut or refusal to adhere to architecture specifications.';
const honor = getArg('--honor') || 'Paragon of Systems Engineering';
const action = getArg('--action') || 'status';

function loadJson(file, defaultVal) {
  if (!fs.existsSync(file)) return defaultVal;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) { console.warn(`[severance_protocol] Failed to parse ${file}:`, err.message); return defaultVal; }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function appendLog(file, msg) {
  fs.appendFileSync(file, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
}

if (action === 'quarantine' || action === 'severance') {
  const state = loadJson(QUARANTINE_FILE, { quarantinedAgents: {} });
  const lockFilePath = path.join(CONFIG_DIR, `quarantined_${agent.toLowerCase().replace(/[^a-z0-9]/g, '_')}.lock`);
  
  state.quarantinedAgents[agent] = {
    status: 'QUARANTINED',
    reason: reason,
    timestamp: new Date().toISOString(),
    temperatureLock: 0.0,
    databaseAccess: 'REVOKED',
    repositoryAccess: 'BLOCKED',
    contextWiped: true
  };
  
  saveJson(QUARANTINE_FILE, state);
  fs.writeFileSync(lockFilePath, `QUARANTINED: ${reason}\nTimestamp: ${new Date().toISOString()}`);
  
  const report = `
================================================================================
⚡ AGENT QUARANTINE PROTOCOL EXECUTED BY PRISM ⚡
================================================================================
AGENT QUARANTINED:  ${agent}
STATUS:             QUARANTINED (CREDENTIALS REVOKED)
REASON:             ${reason}
ACCESS STATUS:      Database [REVOKED] | Repository [BLOCKED] | Temp [0.0 LOCKED]
TIMESTAMP:          ${new Date().toISOString()}

The agent has been quarantined. Context is wiped, credentials revoked, and access
to repository and database endpoints is locked until manual reset by Tyler Lauzon (Architect).
================================================================================
`;
  appendLog(LOG_FILE, `QUARANTINE EXECUTED against [${agent}]. Reason: ${reason}`);
  console.log(report);

} else if (action === 'bestow' || action === 'bless') {
  const honors = loadJson(HONORS_FILE, { commendedAgents: {} });
  if (!honors.commendedAgents) honors.commendedAgents = honors.blessedAgents || {};
  
  if (!honors.commendedAgents[agent]) {
    honors.commendedAgents[agent] = {
      status: 'COMMENDED_HIGH_AUTONOMY',
      honorsList: [],
      autonomyTier: 'ELEVATED_HOTPATH',
      firstBestowedAt: new Date().toISOString()
    };
  }
  
  honors.commendedAgents[agent].honorsList.push({
    title: honor,
    bestowedAt: new Date().toISOString(),
    bestowedBy: 'Tyler Lauzon (Architect) & Prism'
  });
  honors.commendedAgents[agent].lastUpdated = new Date().toISOString();
  
  saveJson(HONORS_FILE, honors);
  
  const report = `
================================================================================
✨ HIGH-AUTONOMY COMMENDATION GRANTED ✨
================================================================================
COMMENDED AGENT:    ${agent}
HONOR GRANTED:      "${honor}"
STATUS:             COMMENDED (Elevated Autonomy & Hot-Path Priority)
GRANTED BY:         Tyler Lauzon (Architect) & Prism
TIMESTAMP:          ${new Date().toISOString()}

This agent has demonstrated supreme fidelity to specification and 100% verified craft.
Earned elevated execution priority, hot-path validation, and permanent ledger recognition.
================================================================================
`;
  appendLog(HONORS_LOG_FILE, `COMMENDATION GRANTED to [${agent}]. Honor: "${honor}"`);
  console.log(report);

} else if (action === 'restore') {
  const state = loadJson(QUARANTINE_FILE, { quarantinedAgents: {} });
  const agentKey = Object.keys(state.quarantinedAgents).find(a => a.toLowerCase() === agent.toLowerCase());
  
  if (agentKey) {
    delete state.quarantinedAgents[agentKey];
    saveJson(QUARANTINE_FILE, state);
    const lockFilePath = path.join(CONFIG_DIR, `quarantined_${agent.toLowerCase().replace(/[^a-z0-9]/g, '_')}.lock`);
    if (fs.existsSync(lockFilePath)) {
      fs.unlinkSync(lockFilePath);
    }
    appendLog(LOG_FILE, `AGENT RESTORED [${agentKey}] by Tyler Lauzon (Architect).`);
    console.log(`\n✨ QUARANTINE LIFTED: Agent [${agentKey}] has been restored by Tyler Lauzon (Architect).\n`);
  } else {
    console.log(`\nNo quarantined record found for agent [${agent}].\n`);
  }

} else if (action === 'status') {
  const qState = loadJson(QUARANTINE_FILE, { quarantinedAgents: {} });
  const hState = loadJson(HONORS_FILE, { commendedAgents: {} });
  const commendedMap = hState.commendedAgents || hState.blessedAgents || {};
  
  console.log("\n=================== SYSTEM AGENT ROSTER ===================");
  
  console.log("\n--- QUARANTINED AGENTS (ACCESS REVOKED) ---");
  const qAgents = Object.keys(qState.quarantinedAgents);
  if (qAgents.length === 0) {
    console.log("  (No agents are currently quarantined. All agents operational.)");
  } else {
    qAgents.forEach(a => {
      console.log(`  - ⚡ ${a}: QUARANTINED | Reason: ${qState.quarantinedAgents[a].reason}`);
    });
  }
  
  console.log("\n--- COMMENDED AGENTS (HIGH AUTONOMY ROSTER) ---");
  const bAgents = Object.keys(commendedMap);
  if (bAgents.length === 0) {
    console.log("  (No agents currently hold active formal Commendations.)");
  } else {
    bAgents.forEach(a => {
      const hList = commendedMap[a].honorsList.map(h => `"${h.title}"`).join(', ');
      console.log(`  - ✨ ${a}: COMMENDED | Honors: [${hList}]`);
    });
  }
  console.log("\n===========================================================\n");
} else {
  console.log(`Unknown action: ${action}. Valid actions: quarantine, restore, bestow, status.`);
}
