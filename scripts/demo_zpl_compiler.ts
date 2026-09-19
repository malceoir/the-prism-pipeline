/**
 * Runnable Demo: Zebra ZPL II 2-on-1 Split Thermal Label Compiler
 * 
 * Demonstrates compiling physical inventory cards into native industrial
 * Zebra Programming Language (ZPL II) bytecode targeting 203 DPI thermal printers.
 * 
 * Run with:
 *   npm run demo:zpl
 *   or: npx tsx scripts/demo_zpl_compiler.ts
 */

import { generateSplitCompactZpl, PrintableCardItem } from '../hardware/zebraZplService.js';

console.log('======================================================================');
console.log('🖨️  ZEBRA ZPL II INDUSTRIAL THERMAL LABEL COMPILER DEMO');
console.log('   Hardware Profile: Zebra GK420d / ZD420 (203 DPI, 2-up double roll)');
console.log('   Layout: 2-on-1 Split-Compact Sticker (Left: X=16, Right: X=256)');
console.log('======================================================================\n');

const sampleCards: PrintableCardItem[] = [
  {
    name: 'Charizard #4 Holo',
    price: 349.99,
    condition: 'Near Mint',
    game: 'Pokemon',
    sku: 'POK-BS-004-HOLO'
  },
  {
    name: "Mishra's Factory (Fall)",
    price: 32.50,
    condition: 'Lightly Played',
    game: 'Magic',
    sku: 'MTG-ATQ-MISH-FALL'
  },
  {
    name: 'Black Lotus #232',
    price: 1499.00,
    condition: 'Near Mint',
    game: 'Magic',
    sku: 'MTG-VMA-LOTUS-NM'
  },
  {
    name: 'Blue-Eyes Shining Dragon',
    price: 32.50,
    condition: 'Moderately Played',
    game: 'YuGiOh',
    sku: 'YGO-RP02-EN096-MP'
  }
];

console.log(`📦 Compiling ${sampleCards.length} collectible cards into dual-card thermal passes...\n`);

const zplOutput = generateSplitCompactZpl(sampleCards);

console.log('--- COMPILED RAW ZPL II BYTECODE OUTPUT ---');
console.log(zplOutput);
console.log('-------------------------------------------\n');

console.log('--- PHYSICAL LABEL PREVIEW (ASCII PROJECTION: 60mm x 25mm 203 DPI) ---');
console.log('┌───────────────────────────────────┬───────────────────────────────────┐');
console.log('│ [X=16] Left Card                  │ [X=256] Right Card                │');
console.log('│ Charizard #4 Holo                 │ Mishra\'s Factory (Fall)           │');
console.log('│                                   │                                   │');
console.log('│ $349.99                           │ $32.50                            │');
console.log('└───────────────────────────────────┴───────────────────────────────────┘');
console.log('┌───────────────────────────────────┬───────────────────────────────────┐');
console.log('│ [X=16] Left Card                  │ [X=256] Right Card                │');
console.log('│ Black Lotus #232                  │ Blue-Eyes Shining Dragon          │');
console.log('│                                   │                                   │');
console.log('│ $1499.00                          │ $32.50                            │');
console.log('└───────────────────────────────────┴───────────────────────────────────┘');
console.log('\n✅ 2-on-1 Split Compact Layout cuts physical label roll consumption by 50% in retail operations.');
console.log('   Ready for direct transmission to Zebra raw socket port 9100 or USB COM spooler.');
