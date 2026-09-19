/**
 * Visual Perceptual Hashing & Hamming Distance Service
 * 
 * Computes difference hashes (dHash) from grayscale image matrices to detect identical
 * or near-identical card artworks and variants across camera captures without cloud API roundtrips.
 */

export interface GrayscaleMatrix {
  width: number;
  height: number;
  pixels: Uint8Array | number[]; // Grayscale 0-255
}

/**
 * Computes a 64-bit difference hash (dHash) from a 9x8 grayscale thumbnail.
 * Each bit represents whether the pixel is brighter than its right neighbor:
 * P[x, y] > P[x+1, y]
 */
export function computeDHashFromGrayscale(matrix: GrayscaleMatrix): string {
  if (matrix.width !== 9 || matrix.height !== 8) {
    throw new Error(`dHash requires an exact 9x8 matrix (received ${matrix.width}x${matrix.height})`);
  }

  let binaryStr = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const leftPixel = matrix.pixels[y * 9 + x];
      const rightPixel = matrix.pixels[y * 9 + (x + 1)];
      binaryStr += leftPixel > rightPixel ? '1' : '0';
    }
  }

  // Convert 64-bit binary string to 16-character hexadecimal string
  let hexStr = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryStr.substring(i, i + 4);
    hexStr += parseInt(nibble, 2).toString(16);
  }

  return hexStr.padStart(16, '0');
}

/**
 * Calculates the Hamming distance (number of bit differences) between two hexadecimal pHashes.
 * - Distance 0: Visually identical.
 * - Distance 1-5: High confidence match (same artwork, minor lighting/rotation variation).
 * - Distance > 10: Completely different artwork.
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) {
    throw new Error('Hash length mismatch for Hamming distance calculation');
  }

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
}
