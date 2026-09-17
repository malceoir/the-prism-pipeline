/**
 * Zebra ZPL Generation Service
 * 
 * Implements standard Zebra Programming Language (ZPL) layouts for:
 * 1. Standard 5-Line Dual-Column Labels (duplicated on left & right)
 * 2. Split Compact 2-on-1 Labels (Card A on Left, Card B on Right, Name + Price only)
 * 
 * Hardware Spec: Zebra GK420d / ZD420 / GX430 203 DPI (60mm x 25mm 2-up label roll).
 * Left Column X=16, Right Column X=256. Max width 466 dots, max height 152-170 dots.
 */

export interface PrintableCardItem {
  name?: string;
  title?: string;
  price?: string | number;
  customPrice?: string | number;
  marketPrice?: string | number;
  condition?: string;
  cardNumber?: string;
  isFoil?: boolean;
  game?: string;
  category?: string;
  sku?: string;
}

export interface SplitNameLines {
  line1: string;
  line2: string;
}

/**
 * Splits card name gracefully across 1 or 2 lines without cutting words in half when possible.
 */
export function splitCardName(rawName?: string, maxLen = 21): SplitNameLines {
  const clean = (rawName || 'Unknown Card')
    .replace(/'/g, "''")
    .trim()
    .replace(/\s+/g, ' ');

  if (clean.length <= maxLen) {
    return { line1: clean, line2: '' };
  }

  // Look for word boundary within maxLen
  const spaceIdx = clean.lastIndexOf(' ', maxLen);
  if (spaceIdx > 5) {
    return {
      line1: clean.substring(0, spaceIdx).trim(),
      line2: clean.substring(spaceIdx + 1, spaceIdx + 1 + maxLen).trim()
    };
  }

  return {
    line1: clean.substring(0, maxLen).trim(),
    line2: clean.substring(maxLen, maxLen * 2).trim()
  };
}

/**
 * Formats a clean currency price string (e.g. $12.29 or $363.23).
 */
export function formatCompactPrice(priceVal?: string | number): string {
  if (typeof priceVal === 'string' && priceVal.trim().startsWith('$')) {
    return priceVal.trim();
  }
  const num = typeof priceVal === 'number'
    ? priceVal
    : parseFloat(String(priceVal || '0').replace(/[^0-9.]/g, '')) || 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Generates Split-Compact 2-on-1 Zebra ZPL.
 * 
 * Rules:
 * - Left half of sticker (X=16) prints Card A.
 * - Right half of sticker (X=256) prints Card B.
 * - ONLY Name and Price are printed (no condition, no barcode, no SKU text).
 * - Saves 50% on sticker consumption.
 * - If total cards is odd, the final label's right half is left blank.
 */
export function generateSplitCompactZpl(items: PrintableCardItem[]): string {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '';
  }

  const zplBlocks: string[] = [];

  for (let i = 0; i < items.length; i += 2) {
    const leftItem = items[i];
    const rightItem = (i + 1 < items.length) ? items[i + 1] : null;

    // Format Left Card
    const leftName = splitCardName(leftItem.name || leftItem.title, 21);
    const leftPrice = formatCompactPrice(leftItem.price ?? leftItem.customPrice ?? leftItem.marketPrice);

    let leftLinesZpl = `^FO16,24^ADN,18,10^FD${leftName.line1}^FS`;
    if (leftName.line2) {
      leftLinesZpl += `\n^FO16,46^ADN,18,10^FD${leftName.line2}^FS`;
    }
    leftLinesZpl += `\n^FO16,76^ADN,36,20^FD${leftPrice}^FS`;

    // Format Right Card (if present)
    let rightLinesZpl = '';
    if (rightItem) {
      const rightName = splitCardName(rightItem.name || rightItem.title, 21);
      const rightPrice = formatCompactPrice(rightItem.price ?? rightItem.customPrice ?? rightItem.marketPrice);

      rightLinesZpl = `^FO256,24^ADN,18,10^FD${rightName.line1}^FS`;
      if (rightName.line2) {
        rightLinesZpl += `\n^FO256,46^ADN,18,10^FD${rightName.line2}^FS`;
      }
      rightLinesZpl += `\n^FO256,76^ADN,36,20^FD${rightPrice}^FS`;
    }

    const block = `^XA
~SD12
^LH0,0
${leftLinesZpl}
${rightLinesZpl}
^XZ`;
    zplBlocks.push(block);
  }

  return zplBlocks.join('\n');
}
