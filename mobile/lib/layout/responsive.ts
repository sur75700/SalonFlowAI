export function getResponsiveLayout(width: number) {
  const isNarrow = width < 390;
  const isPhone = width < 768;
  const isTablet = width >= 768;

  return {
    isNarrow,
    isPhone,
    isTablet,
    screenPadding: isNarrow ? 12 : 16,
    cardGap: isNarrow ? 10 : 12,
    singleColumn: width < 430,
    twoColumn: width >= 430 && width < 768,
    threeColumn: width >= 768,
  };
}
