const fs = require('fs');
const path = require('path');
const https = require('https');

function triggerEmergencyAlert(record) {
  try {
    const origSetNumber = getAttr(record.initialCard, 'Setnumber', 'setNumber', 'setnumber');
    const origSet = getAttr(record.initialCard, 'Set', 'set', 'setName');
    const valSetNumber = getAttr(record.validatedCard, 'setNumber', 'setnumber', 'setNumber');
    const valSet = getAttr(record.validatedCard, 'set', 'setName');

    const alertData = JSON.stringify({
      transitId: record.transitId,
      message: `🚨 PRISM EMERGENCY ALERT: Set mismatch detected on ${record.transitId}! Scanned ${origSet} #${origSetNumber}, got ${valSet} #${valSetNumber}.`,
      item: { origSet, origSetNumber, valSet, valSetNumber }
    });

    const req = https.request({
      hostname: '127.0.0.1',
      port: 3080,
      path: '/api/emergency-alert',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      rejectUnauthorized: false
    }, () => {});
    req.on('error', () => {});
    req.write(alertData);
    req.end();
  } catch (_) {}
}

const LOGS_DIR = path.join('C:', 'Users', 'tyler lauzon', '.gemini', 'config', 'logs');
const TRANSIT_JSON_LOG = path.join(LOGS_DIR, 'transit_record_ledger.json');
const TRANSIT_TEXT_LOG = path.join(LOGS_DIR, 'transit_record_ledger.log');

function ensureDirectoryExists() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function safeParseJson(str) {
  if (!str) return null;
  if (str.startsWith('b64:')) {
    try {
      const decoded = Buffer.from(str.slice(4), 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (_) {}
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      const normalized = str.replace(/'/g, '"');
      return JSON.parse(normalized);
    } catch (_) {
      return { raw: str };
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    phase: 'init',
    transitId: `transit-${Date.now()}`,
    cardData: null,
    validatedData: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--phase' && args[i + 1]) parsed.phase = args[++i].toLowerCase();
    if (arg === '--transitId' && args[i + 1]) parsed.transitId = args[++i];
    if (arg === '--cardData' && args[i + 1]) {
      parsed.cardData = safeParseJson(args[++i]);
    }
    if (arg === '--validatedData' && args[i + 1]) {
      parsed.validatedData = safeParseJson(args[++i]);
    }
  }

  return parsed;
}

function loadTransitRecords() {
  ensureDirectoryExists();
  if (fs.existsSync(TRANSIT_JSON_LOG)) {
    try {
      const data = fs.readFileSync(TRANSIT_JSON_LOG, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse existing transit ledger, starting fresh:', e.message);
    }
  }
  return {};
}

function getAttr(obj, ...keys) {
  if (!obj) return '';
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return obj[k].toString().trim();
    }
  }
  return '';
}

function saveTransitRecords(records) {
  ensureDirectoryExists();
  fs.writeFileSync(TRANSIT_JSON_LOG, JSON.stringify(records, null, 2), 'utf8');

  const textContent = Object.values(records)
    .map((r) => {
      const origName = getAttr(r.initialCard, 'Cardname', 'cardName', 'name') || 'Unknown';
      const origSet = getAttr(r.initialCard, 'Set', 'set', 'setName') || 'Unknown';
      const origNum = getAttr(r.initialCard, 'Setnumber', 'setNumber', 'setnumber') || 'N/A';
      const url = r.validatedCard?.urls?.tcgplayerUrl || r.validatedCard?.tcgplayerUrl || 'N/A';
      const valStatus = r.validatedCard?.validationGate?.status || 'PENDING';

      return `===========================================================\n📜 ARCHIVIST TRANSIT RECORD: ${r.transitId}\nStatus: ${r.status}\nArchivist Watched: ${r.archivistWatching ? 'YES' : 'NO'}\nOriginal Card: ${origName} (${origSet} #${origNum})\nTCGPlayer Resolved URL: ${url}\nValidation Gate Status: ${valStatus}\nArchivist Audit Verdict: ${r.archivistAuditVerdict || 'PENDING_TRADE_COMPLETE_PING'}\nLast Updated: ${r.lastUpdated}\n===========================================================`;
    })
    .join('\n\n');

  fs.writeFileSync(TRANSIT_TEXT_LOG, textContent, 'utf8');
}

function executeTransitRecord() {
  const params = parseArgs();
  ensureDirectoryExists();
  const records = loadTransitRecords();

  const recordId = params.transitId;
  let record = records[recordId] || {
    transitId: recordId,
    createdAt: new Date().toISOString(),
    status: 'TRANSIT_INITIATED',
    archivistWatching: true,
    initialCard: null,
    validatedCard: null,
    archivistAuditVerdict: 'PENDING_VALIDATION',
    lastUpdated: new Date().toISOString()
  };

  if (params.phase === 'init') {
    record.status = 'TRANSIT_INITIATED';
    record.archivistWatching = true;
    record.initialCard = params.cardData || record.initialCard;
    record.lastUpdated = new Date().toISOString();
    records[recordId] = record;

    const origName = getAttr(record.initialCard, 'Cardname', 'cardName', 'name') || 'Card';
    const origSet = getAttr(record.initialCard, 'Set', 'set', 'setName') || 'Set';
    const origNum = getAttr(record.initialCard, 'Setnumber', 'setNumber', 'setnumber') || 'N/A';

    console.log(`\n📜 [THE ARCHIVIST]: Transit Record ${recordId} INITIATED & LOGGED.`);
    console.log(`   Watching item: ${origName} (${origSet} #${origNum})`);
  } else if (params.phase === 'validated') {
    record.status = 'VALIDATION_RECORDED';
    record.validatedCard = params.validatedData || record.validatedCard;
    record.lastUpdated = new Date().toISOString();
    records[recordId] = record;

    const url = record.validatedCard?.urls?.tcgplayerUrl || record.validatedCard?.tcgplayerUrl || 'N/A';
    console.log(`\n📜 [THE ARCHIVIST]: Transit Record ${recordId} POST-VALIDATION LOGGED.`);
    console.log(`   Resolved TCGPlayer URL: ${url}`);
  } else if (params.phase === 'complete') {
    record.status = 'TRADE_COMPLETE_PING_RECEIVED';
    record.lastUpdated = new Date().toISOString();

    console.log(`\n📜 [THE ARCHIVIST]: TRADE COMPLETE PING RECEIVED for ${recordId}. Conducting final audit...`);

    const origSetNumber = getAttr(record.initialCard, 'Setnumber', 'setNumber', 'setnumber');
    const origSet = getAttr(record.initialCard, 'Set', 'set', 'setName').toLowerCase();

    const valGate = record.validatedCard?.validationGate || {};
    const valSetNumber = getAttr(record.validatedCard, 'setNumber', 'setnumber', 'setNumber') || getAttr(valGate, 'returnedSetNumber');
    const valSet = (getAttr(record.validatedCard, 'set', 'setName') || getAttr(valGate, 'returnedSet')).toLowerCase();

const VINTAGE_NO_NUMBER_SETS = new Set([
  'alpha', 'beta', 'unlimited', 'revised edition', 'revised', 'magic revised',
  'arabian nights', 'antiquities', 'legends', 'the dark', 'fallen empires',
  'ice age', 'homelands', 'alliances', 'mirage', 'visions', 'weatherlight',
  'tempest', 'stronghold', 'exodus'
]);

function parseCollectorNumber(raw) {
  if (!raw) return { raw: '', baseNumber: '', prefix: null, suffix: null, canonicalKey: '' };
  const cleaned = raw.toString().trim().toUpperCase().split('/')[0].replace(/\s+/g, '');
  const segments = cleaned.split(/[-_]/).filter(Boolean);
  
  let prefix = null;
  let baseNumber = '';
  let suffix = null;

  if (segments.length > 1) {
    prefix = segments.slice(0, -1).join('-');
    const lastSegment = segments[segments.length - 1];
    const subMatch = lastSegment.match(/^([A-Z]*)(\d+)([A-Z])?$/);
    if (subMatch) {
      if (subMatch[1]) prefix += `-${subMatch[1]}`;
      baseNumber = subMatch[2].replace(/^0+(?=\d)/, '');
      suffix = subMatch[3] || null;
    } else {
      baseNumber = lastSegment.replace(/^0+(?=\d)/, '');
    }
  } else {
    const singleMatch = cleaned.match(/^([A-Z]*)(\d+)([A-Z])?$/);
    if (singleMatch) {
      prefix = singleMatch[1] || null;
      baseNumber = singleMatch[2].replace(/^0+(?=\d)/, '');
      suffix = singleMatch[3] || null;
    } else {
      baseNumber = cleaned.replace(/^0+(?=\d)/, '').replace(/[^A-Z0-9]/g, '');
    }
  }

  const canonicalKey = `${prefix ? prefix + '-' : ''}${baseNumber}${suffix || ''}`;

  return { raw: raw.toString(), baseNumber, prefix, suffix, canonicalKey };
}

function formatCanonicalKey(tcg, prefix, baseNumber, suffix) {
  const cleanTcg = (tcg || '').toLowerCase().trim();
  const numericVal = parseInt(baseNumber, 10);
  const requiresThreeDigitPadding = ['yugioh', 'onepiece', 'lorcana', 'starwars'].includes(cleanTcg);

  let formattedNum = baseNumber;
  if (!isNaN(numericVal) && requiresThreeDigitPadding) {
    formattedNum = String(numericVal).padStart(3, '0');
  }

  const prefixPart = prefix ? `${prefix}-` : '';
  const suffixPart = suffix || '';
  return `${prefixPart}${formattedNum}${suffixPart}`;
}

function areCollectorKeysEquivalent(tcg, scannedKey, resolvedKey) {
  if (!scannedKey.baseNumber || !resolvedKey.baseNumber) return false;
  if (parseInt(scannedKey.baseNumber, 10) !== parseInt(resolvedKey.baseNumber, 10)) return false;
  if ((scannedKey.suffix || null) !== (resolvedKey.suffix || null)) return false;
  if (scannedKey.prefix && resolvedKey.prefix) {
    return scannedKey.prefix.replace(/[^A-Z0-9]/g, '') === resolvedKey.prefix.replace(/[^A-Z0-9]/g, '');
  }
  return true;
}

function normalizeCollectorNumber(raw, tcg = 'mtg') {
  const parsed = parseCollectorNumber(raw);
  if (!parsed.baseNumber) return '';
  return formatCanonicalKey(tcg, parsed.prefix, parsed.baseNumber, parsed.suffix);
}

const DLQ_PATH = path.join(LOGS_DIR, 'transit_dlq.json');
const NDJSON_DLQ_PATH = path.join(LOGS_DIR, 'transit_dlq.ndjson');

let dlqStream = null;
function getDLQStream() {
  if (!dlqStream || dlqStream.destroyed) {
    dlqStream = fs.createWriteStream(NDJSON_DLQ_PATH, { flags: 'a', encoding: 'utf8' });
  }
  return dlqStream;
}

// Graceful Stream Drain on Process Termination
function handleGracefulExit() {
  if (dlqStream && !dlqStream.destroyed) {
    dlqStream.end();
  }
}

if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', handleGracefulExit);
  process.on('SIGINT', () => { handleGracefulExit(); process.exit(0); });
  process.on('SIGTERM', () => { handleGracefulExit(); process.exit(0); });
}

function recordDlqAnomaly(record, errorMsg) {
  try {
    const failureEntry = {
      timestamp: new Date().toISOString(),
      transitId: record.transitId,
      error: errorMsg,
      initialCard: record.initialCard,
      validatedCard: record.validatedCard
    };

    // 1. Persistent stream NDJSON append (prevent FD thrashing)
    getDLQStream().write(JSON.stringify(failureEntry) + '\n');

    // 2. Standard JSON DLQ
    let dlqRecords = [];
    if (fs.existsSync(DLQ_PATH)) {
      try { dlqRecords = JSON.parse(fs.readFileSync(DLQ_PATH, 'utf8')); } catch (_) { dlqRecords = []; }
    }
    dlqRecords.push(failureEntry);
    fs.writeFileSync(DLQ_PATH, JSON.stringify(dlqRecords, null, 2), 'utf8');
  } catch (_) {}
}

    // --- HARDENED ARCHITECT VALIDATION GATE & NUMBER NORMALIZER ---
    const tcgType = getAttr(record.initialCard, 'Tcg', 'tcg', 'category') || 'mtg';
    const parsedScanned = parseCollectorNumber(origSetNumber);
    const parsedResolved = parseCollectorNumber(valSetNumber);

    const normScanned = formatCanonicalKey(tcgType, parsedScanned.prefix, parsedScanned.baseNumber, parsedScanned.suffix);
    const normResolved = formatCanonicalKey(tcgType, parsedResolved.prefix, parsedResolved.baseNumber, parsedResolved.suffix);
    const isVintage = VINTAGE_NO_NUMBER_SETS.has(origSet);

    const scannedExists = parsedScanned.baseNumber !== '';
    const resolvedExists = parsedResolved.baseNumber !== '';

    let setNumMatch = true;
    if (scannedExists && resolvedExists) {
      setNumMatch = areCollectorKeysEquivalent(tcgType, parsedScanned, parsedResolved);
    } else if (!scannedExists && resolvedExists) {
      setNumMatch = isVintage;
    }

    const setMatch = origSet 
      ? (valSet !== '' && (origSet.includes(valSet) || valSet.includes(origSet)))
      : true;

    if (setNumMatch && setMatch) {
      console.log(`✅ [THE ARCHIVIST]: AUDIT APPROVED! Card set & collector number match verified (${normScanned || 'VINTAGE'} === ${normResolved}). Discarding entry from transit ledger to prevent log bloat.`);
      delete records[recordId];
    } else {
      record.archivistAuditVerdict = 'FATAL_LOGIC_FLAW_DETECTED';
      record.status = 'EMERGENCY_PRISM_INTERVENTION_REQUIRED';
      records[recordId] = record;

      triggerEmergencyAlert(record);
      recordDlqAnomaly(record, `Collector Number Mismatch: Scanned '${origSetNumber}' (${normScanned}) vs Resolved '${valSetNumber}' (${normResolved})`);

      console.error(`\n🚨 [THE ARCHIVIST CRITICAL ALERT]: FATAL LOGIC FLAW DETECTED!`);
      console.error(`   Card passed through trade queue without matching required set/setnumber!`);
      console.error(`   Original: Set="${origSet}", SetNumber="${origSetNumber}" (Norm: '${normScanned}')`);
      console.error(`   Returned: Set="${valSet}", SetNumber="${valSetNumber}" (Norm: '${normResolved}')`);
      console.error(`\n👑 SUMMONING PRISM: PRISM EMERGENCY PATCH PROTOCOL ACTIVATED!`);
      console.error(`   Prism must execute an emergency patch to prevent unverified card data bypass.\n`);
    }
  }

  saveTransitRecords(records);
  console.log(`📁 Archivist Transit Ledger: ${TRANSIT_TEXT_LOG}\n`);
}

executeTransitRecord();

executeTransitRecord();
