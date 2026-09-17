const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join('C:', 'Users', 'tyler lauzon', '.gemini', 'config', 'logs');
const JSON_LOG_FILE = path.join(LOGS_DIR, 'absolutions_decrees.json');
const TEXT_LOG_FILE = path.join(LOGS_DIR, 'absolutions_decrees.log');

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function ensureDirectoryExists() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    agent: 'WorkerAgent',
    status: 'UNKNOWN',
    truth: '',
    violations: [],
    mandate: '',
    action: 'log'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--agent' && args[i + 1]) parsed.agent = args[++i];
    if (arg === '--status' && args[i + 1]) parsed.status = args[++i].toUpperCase();
    if (arg === '--truth' && args[i + 1]) parsed.truth = args[++i];
    if (arg === '--violations' && args[i + 1]) parsed.violations = args[++i].split(';');
    if (arg === '--mandate' && args[i + 1]) parsed.mandate = args[++i];
    if (arg === '--action' && args[i + 1]) parsed.action = args[++i];
  }

  return parsed;
}

function loadDecrees() {
  ensureDirectoryExists();
  if (fs.existsSync(JSON_LOG_FILE)) {
    try {
      const data = fs.readFileSync(JSON_LOG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse existing decrees log, starting fresh:', e.message);
    }
  }
  return [];
}

function saveDecrees(decrees) {
  ensureDirectoryExists();
  fs.writeFileSync(JSON_LOG_FILE, JSON.stringify(decrees, null, 2), 'utf8');

  // Also maintain human-readable log file
  const textContent = decrees
    .map((d) => {
      return `===========================================================\n[${d.timestamp}] DECREE OF ABSOLUTION: ${d.status}\nAgent Audited: ${d.agent}\nTruth Anchor: "${d.truth}"\nViolations: ${d.violations.length > 0 ? d.violations.join(', ') : 'None'}\nMandate: ${d.mandate}\n===========================================================`;
    })
    .join('\n\n');

  fs.writeFileSync(TEXT_LOG_FILE, textContent, 'utf8');
}

function pruneOldDecrees(decrees) {
  const now = Date.now();
  const cutoff = now - TWELVE_HOURS_MS;
  return decrees.filter((d) => {
    const timestampMs = new Date(d.timestamp).getTime();
    return timestampMs >= cutoff;
  });
}

function logDecree() {
  const params = parseArgs();
  ensureDirectoryExists();

  let decrees = loadDecrees();

  if (params.action === 'log' || params.status !== 'UNKNOWN') {
    const newDecree = {
      id: `decree-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: params.agent,
      status: params.status,
      truth: params.truth || 'Original user intent',
      violations: params.violations.filter(Boolean),
      mandate: params.mandate || 'None'
    };

    decrees.push(newDecree);
  }

  // Prune any entries older than 12 hours
  const initialCount = decrees.length;
  decrees = pruneOldDecrees(decrees);
  const prunedCount = initialCount - decrees.length;

  saveDecrees(decrees);

  console.log(`\n⚖️ ABSOLUTION'S DECREE LEDGER UPDATED`);
  console.log(`Total Active Decrees (Last 12 Hours): ${decrees.length}`);
  if (prunedCount > 0) {
    console.log(`🧹 Pruned ${prunedCount} decree(s) older than 12 hours.`);
  }
  console.log(`📁 Log Location: ${TEXT_LOG_FILE}\n`);
}

logDecree();
