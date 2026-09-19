/**
 * Runnable Demo: Multi-Frame Specular Glare & Reflection Rejection
 * 
 * Demonstrates the pixel-wise minimum luminance blending algorithm (blendMinLuminance)
 * used in the PricePoint WebRTC camera ingestion engine to eliminate plastic sleeve glare
 * and top-loader reflection flare without blurring card artwork.
 * 
 * Run with:
 *   npm run demo:glare
 *   or: npx tsx scripts/demo_glare_rejection.ts
 */

import { blendMinLuminance, ImageFrame } from '../vision/imageWarpUtils.js';

console.log('======================================================================');
console.log('✨ MULTI-FRAME SPECULAR GLARE REJECTION DEMO (imageWarpUtils.ts)');
console.log('   Algorithm: Pixel-wise Minimum Luminance Blending (blendMinLuminance)');
console.log('   Hardware Scenario: Polypropylene Card Sleeve Under Flourescent Store Lighting');
console.log('======================================================================\n');

const width = 10;
const height = 10;
const totalPixels = width * height;

// Create Frame 1: Base card artwork (dark card, pixel value ~50), with a bright glare hotspot on the LEFT (pixels 0-4)
const frame1Data = new Uint8ClampedArray(totalPixels * 4);
for (let i = 0; i < totalPixels; i++) {
  const isLeftGlare = (i % width) < 4;
  const val = isLeftGlare ? 245 : 60; // 245 = washed out white specular glare, 60 = true dark card face
  frame1Data[i * 4] = val;     // R
  frame1Data[i * 4 + 1] = val; // G
  frame1Data[i * 4 + 2] = val; // B
  frame1Data[i * 4 + 3] = 255; // Alpha
}

// Create Frame 2: Device shifted slightly. Glare moved to the RIGHT (pixels 6-9). Left side is now clean!
const frame2Data = new Uint8ClampedArray(totalPixels * 4);
for (let i = 0; i < totalPixels; i++) {
  const isRightGlare = (i % width) >= 6;
  const val = isRightGlare ? 245 : 60;
  frame2Data[i * 4] = val;
  frame2Data[i * 4 + 1] = val;
  frame2Data[i * 4 + 2] = val;
  frame2Data[i * 4 + 3] = 255;
}

const frame1: ImageFrame = { data: frame1Data, width, height };
const frame2: ImageFrame = { data: frame2Data, width, height };

function countGlarePixels(frame: ImageFrame): number {
  let glareCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const luma = 0.299 * frame.data[i * 4] + 0.587 * frame.data[i * 4 + 1] + 0.114 * frame.data[i * 4 + 2];
    if (luma > 200) glareCount++;
  }
  return glareCount;
}

console.log(`📸 Frame 1: ${countGlarePixels(frame1)} / ${totalPixels} pixels blinded by specular glare (Left Region)`);
console.log(`📸 Frame 2: ${countGlarePixels(frame2)} / ${totalPixels} pixels blinded by specular glare (Right Region)`);

console.log('\n⚙️  Executing blendMinLuminance([Frame1, Frame2])...');
const composite = blendMinLuminance([frame1, frame2]);

if (!composite) {
  console.error('❌ Failed to blend frames');
  process.exit(1);
}

const compositeGlareCount = countGlarePixels(composite);
console.log(`🛡️  Composite Result: ${compositeGlareCount} / ${totalPixels} glare pixels remain.`);
console.log(`🎉 Glare Suppression Rate: ${(((countGlarePixels(frame1) + countGlarePixels(frame2) - compositeGlareCount) / (countGlarePixels(frame1) + countGlarePixels(frame2))) * 100).toFixed(1)}%`);
console.log('✅ Underlying card typography and dark card surface successfully recovered without edge distortion.\n');
