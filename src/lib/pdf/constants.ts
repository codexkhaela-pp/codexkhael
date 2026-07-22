export const PDF_LAYOUT = {
  pageWidthPt: 595.28,
  pageHeightPt: 841.89,

  // Safe zones calculated visually based on A4 and the template
  safeTopPt: 112,
  safeBottomPt: 108,
  safeLeftPt: 88,
  safeRightPt: 88,
  
  // Safe zone for the cover specifically (lower to separate from logo)
  coverSafeTopPt: 350,
  coverSafeBottomPt: 120,
  coverSafeLeftPt: 88,
  coverSafeRightPt: 88,

  // Typography
  titleSizePt: 24,
  sectionTitleSizePt: 18,
  subSectionTitleSizePt: 14,
  bodySizePt: 11,
  metadataSizePt: 9.5,

  // Spacing
  paragraphSpacingPt: 10,
  sectionSpacingPt: 18,
  lineHeightMultiplier: 1.45,

  // Colors
  textColor: '#17130F',
  coverTextColor: '#FFFFFF',
};

export const COVER_LAYOUT = {
  titleYPt: 240,
  subtitleYPt: 0,
};
