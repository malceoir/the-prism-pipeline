/**
 * Advanced Image Processing Utilities for Price Point Vision Scanner
 * Includes Multi-Frame Specular Glare Rejection & Perspective Contour Rectification
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface ImageFrame {
  data: Uint8ClampedArray | number[];
  width: number;
  height: number;
}

/**
 * Multi-Frame Glare Rejection: Combines multiple video frame snapshots using pixel-wise minimum luminance.
 * Specular reflections (white glare spots) shift as the device moves; taking minimum luminance
 * strips out bright white reflections while preserving underlying card text and artwork.
 */
export function blendMinLuminance(imageDatas: ImageFrame[]): ImageFrame | null {
  if (!imageDatas || imageDatas.length === 0) return null;
  if (imageDatas.length === 1) return imageDatas[0];

  const width = imageDatas[0].width;
  const height = imageDatas[0].height;
  const len = width * height * 4;

  const resultData = new Uint8ClampedArray(len);
  const numFrames = imageDatas.length;

  for (let i = 0; i < len; i += 4) {
    let minLuma = 999;
    let minR = imageDatas[0].data[i];
    let minG = imageDatas[0].data[i + 1];
    let minB = imageDatas[0].data[i + 2];
    let minA = imageDatas[0].data[i + 3];

    for (let f = 0; f < numFrames; f++) {
      const r = imageDatas[f].data[i];
      const g = imageDatas[f].data[i + 1];
      const b = imageDatas[f].data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (luma < minLuma) {
        minLuma = luma;
        minR = r;
        minG = g;
        minB = b;
        minA = imageDatas[f].data[i + 3];
      }
    }

    resultData[i] = minR;
    resultData[i + 1] = minG;
    resultData[i + 2] = minB;
    resultData[i + 3] = minA;
  }

  if (typeof ImageData !== 'undefined') {
    return new ImageData(resultData, width, height);
  }
  return { data: resultData, width, height };
}

/**
 * Perspective Rectification: Warps a 4-corner quadrilateral boundary from a camera frame
 * into an upright normalized rectangular canvas (e.g. 600x840 px).
 */
export function warpPerspectiveCanvas(
  sourceCtx: CanvasRenderingContext2D,
  corners: Point2D[], // Top-Left, Top-Right, Bottom-Right, Bottom-Left
  targetW: number = 600,
  targetH: number = 840
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!corners || corners.length !== 4) return null;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  // Simple bilinear grid sampling warp
  const srcImgData = sourceCtx.getImageData(0, 0, sourceCtx.canvas.width, sourceCtx.canvas.height);
  const dstImgData = ctx.createImageData(targetW, targetH);

  const p0 = corners[0]; // Top-Left
  const p1 = corners[1]; // Top-Right
  const p2 = corners[2]; // Bottom-Right
  const p3 = corners[3]; // Bottom-Left

  const srcW = sourceCtx.canvas.width;
  const srcH = sourceCtx.canvas.height;

  for (let dy = 0; dy < targetH; dy++) {
    const v = dy / targetH;
    for (let dx = 0; dx < targetW; dx++) {
      const u = dx / targetW;

      // Bilinear interpolation of corner coordinates
      const sx = (1 - u) * (1 - v) * p0.x + u * (1 - v) * p1.x + u * v * p2.x + (1 - u) * v * p3.x;
      const sy = (1 - u) * (1 - v) * p0.y + u * (1 - v) * p1.y + u * v * p2.y + (1 - u) * v * p3.y;

      const px = Math.max(0, Math.min(srcW - 1, Math.round(sx)));
      const py = Math.max(0, Math.min(srcH - 1, Math.round(sy)));

      const srcIdx = (py * srcW + px) * 4;
      const dstIdx = (dy * targetW + dx) * 4;

      dstImgData.data[dstIdx] = srcImgData.data[srcIdx];
      dstImgData.data[dstIdx + 1] = srcImgData.data[srcIdx + 1];
      dstImgData.data[dstIdx + 2] = srcImgData.data[srcIdx + 2];
      dstImgData.data[dstIdx + 3] = 255;
    }
  }

  ctx.putImageData(dstImgData, 0, 0);
  return canvas;
}
