import fs from 'fs';
import path from 'path';

export interface AntiBandaidIssue {
  filePath: string;
  lineNumber: number;
  snippet: string;
  issueType: string;
  recommendation: string;
}

const TARGET_PATHS = ['core', 'governance', 'hardware', 'scanners', 'vision', 'scripts'];
const IGNORED_SCRIPTS = ['detect_silent_fallbacks.ts']; // Ignore the auditor itself

function collectTargetFiles(targets: string[]): string[] {
  const fileList: string[] = [];

  targets.forEach(target => {
    const resolved = path.resolve(process.cwd(), target);
    if (!fs.existsSync(resolved)) return;

    if (fs.statSync(resolved).isFile()) {
      if (resolved.endsWith('.ts') || resolved.endsWith('.tsx') || resolved.endsWith('.js')) {
        fileList.push(resolved);
      }
      return;
    }

    function walk(dir: string) {
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          if (entry !== 'node_modules' && entry !== 'dist') {
            walk(fullPath);
          }
        } else if (
          (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.js')) &&
          !IGNORED_SCRIPTS.includes(entry)
        ) {
          fileList.push(fullPath);
        }
      });
    }

    walk(resolved);
  });

  return fileList;
}

function hasLogging(text: string): boolean {
  return /console\.(warn|error|log|info|debug)/.test(text) ||
         /logger\.(warn|error|log|info|debug)/.test(text) ||
         /log\.(warn|error|log|info|debug)/.test(text) ||
         /log\(/.test(text) ||
         /appendFileSync/.test(text);
}

function scanFile(filePath: string): AntiBandaidIssue[] {
  const issues: AntiBandaidIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // 1. Line-by-line checks for dummy fallback strings & environment bypasses
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Environment checks (window/fs) returning empty string/null silently
    if (
      /typeof window\s*!==?\s*['"]undefined['"]/.test(trimmed) &&
      /return\s*(""|''|``|null|undefined)/.test(trimmed) &&
      !hasLogging(trimmed)
    ) {
      issues.push({
        filePath,
        lineNumber: lineNum,
        snippet: trimmed,
        issueType: 'SILENT_ENVIRONMENT_BYPASS',
        recommendation: 'Do not silently return empty fallbacks on window/fs checks; use a bundled import or log an explicit warning.'
      });
    }

    // Silent dummy fallback string returns masking failures without logging
    if (/return\s*["'](Unknown Set|Unknown Card|Unspecified|Unknown Game)["']/.test(trimmed)) {
      const prevContext = lines.slice(Math.max(0, idx - 4), idx).join(' ');
      if (!hasLogging(prevContext) && !hasLogging(trimmed)) {
        issues.push({
          filePath,
          lineNumber: lineNum,
          snippet: trimmed,
          issueType: 'UNLOGGED_DUMMY_FALLBACK',
          recommendation: 'Log an explicit warning/error before returning a dummy fallback string so failures are visible in diagnostics.'
        });
      }
    }
  });

  // 2. Comprehensive multi-line and single-line catch block scanner
  const catchRegex = /catch\s*\(([^)]*)\)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = catchRegex.exec(content)) !== null) {
    const body = match[2].trim();
    // Catch block is silent if body has no logging and is either empty, comment-only, or just returns/continues
    if (!hasLogging(body)) {
      // Check if body is empty or just returns/void
      const isSwallowed = !body || /^(return(\s+[^;]+)?;?|\/\/.*|\/\*[\s\S]*\*\/)*$/.test(body);
      if (isSwallowed) {
        const upToMatch = content.slice(0, match.index);
        const lineNum = upToMatch.split('\n').length;
        const snippet = match[0].replace(/\s+/g, ' ');

        issues.push({
          filePath,
          lineNumber: lineNum,
          snippet: snippet.length > 80 ? snippet.slice(0, 77) + '...' : snippet,
          issueType: 'SILENT_CATCH_BLOCK',
          recommendation: 'Every catch block must log an explicit console.warn, console.error, or logger record with exception details.'
        });
      }
    }
  }

  return issues;
}

export function runAntiBandaidAudit(): AntiBandaidIssue[] {
  console.log(`🛡️  Running Total Codebase Anti-Bandaid & Silent Fallback Audit across [${TARGET_PATHS.join(', ')}]...\n`);
  const allFiles = collectTargetFiles(TARGET_PATHS);
  const allIssues: AntiBandaidIssue[] = [];

  allFiles.forEach(file => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });

  console.log(`Audited ${allFiles.length} files across repository. Found ${allIssues.length} shortcut/bandaid issue(s):\n`);

  if (allIssues.length === 0) {
    console.log('✅ 100% CLEAN! Zero silent fallbacks, unlogged empty catches, or dummy string masking detected across the entire codebase.');
  } else {
    allIssues.forEach((issue, idx) => {
      const relPath = path.relative(process.cwd(), issue.filePath);
      console.log(`${idx + 1}. [${issue.issueType}] ${relPath}:${issue.lineNumber}`);
      console.log(`   Code: "${issue.snippet}"`);
      console.log(`   Fix: ${issue.recommendation}\n`);
    });
    process.exit(1);
  }

  return allIssues;
}

runAntiBandaidAudit();
