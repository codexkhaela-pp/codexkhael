import fs from "fs";
import path from "path";

const assetCache = new Map<string, Buffer>();

function getAsset(filePath: string): Buffer {
  if (assetCache.has(filePath)) {
    return assetCache.get(filePath)!;
  }
  try {
    const data = fs.readFileSync(filePath);
    assetCache.set(filePath, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to load asset at path: ${filePath}. Error: ${(error as Error).message}`);
  }
}

export function getPdfCoverBytes(): Buffer {
  const filePath = path.join(process.cwd(), "src", "image", "pdf-cover-khael.png");
  return getAsset(filePath);
}

export function getPdfTemplateBytes(): Buffer {
  const filePath = path.join(process.cwd(), "src", "image", "pdf-reading-template.png");
  return getAsset(filePath);
}

export function getFontRegularBytes(): Buffer {
  const filePath = path.join(process.cwd(), "src", "fonts", "CormorantGaramond-SemiBold.ttf");
  return getAsset(filePath);
}

export function getFontSemiBoldBytes(): Buffer {
  const filePath = path.join(process.cwd(), "src", "fonts", "CormorantGaramond-SemiBold.ttf");
  return getAsset(filePath);
}

export function getCardImageBytes(imagePath: string): Buffer {
  // imagePath is assumed to be an absolute web path from root, e.g., "/tarot/the_fool.jpg"
  // We resolve it relative to the "public" directory.
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  const filePath = path.join(process.cwd(), "public", ...cleanPath.split("/"));
  return getAsset(filePath);
}
