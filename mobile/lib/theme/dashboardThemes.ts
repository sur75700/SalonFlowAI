export type DashboardThemeId =
  | "royal_cosmos"
  | "royal_gold_cosmos";

export type DashboardThemePalette = Readonly<{
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  royal: string;
  royalGlow: string;
  gold: string;
  goldGlow: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  positive: string;
  positiveSoft: string;
  neutral: string;
  neutralSoft: string;
  negative: string;
  negativeSoft: string;
  warning: string;
  danger: string;
  neutralAccent: string;
  cosmosBlue: string;
  cosmosViolet: string;
  cosmosMagenta: string;
  gridLine: string;
}>;

export type DashboardThemeOverlay = Readonly<{
  darkVeil: string;
  toneVeil: string;
  bottomDepth: string;
}>;

export type DashboardThemeDefinition = Readonly<{
  id: DashboardThemeId;
  palette: DashboardThemePalette;
  overlay: DashboardThemeOverlay;
  backgroundFallback: string;
}>;

export const DEFAULT_DASHBOARD_THEME_ID:
  DashboardThemeId = "royal_cosmos";

export const DASHBOARD_THEMES: Readonly<
  Record<DashboardThemeId, DashboardThemeDefinition>
> = Object.freeze({
  royal_cosmos: {
    id: "royal_cosmos",
    backgroundFallback: "#040508",
    overlay: {
      darkVeil: "rgba(3,5,12,0.60)",
      toneVeil: "rgba(8,16,36,0.27)",
      bottomDepth: "rgba(10,18,42,0.18)",
    },
    palette: {
      surface: "#171938",
      surfaceRaised: "#1D1F47",
      border: "rgba(255,255,255,0.07)",
      borderStrong: "rgba(124,92,255,0.30)",
      royal: "#7C5CFF",
      royalGlow: "rgba(124,92,255,0.30)",
      gold: "#E8C97A",
      goldGlow: "rgba(232,201,122,0.24)",
      textPrimary: "#F6F5FB",
      textSecondary: "#A6A7C4",
      textTertiary: "#6F7092",
      positive: "#3FCF8E",
      positiveSoft: "rgba(63,207,142,0.14)",
      neutral: "#F2B84B",
      neutralSoft: "rgba(242,184,75,0.14)",
      negative: "#F2617A",
      negativeSoft: "rgba(242,97,122,0.14)",
      warning: "#F2B84B",
      danger: "#F2617A",
      neutralAccent: "#5CB8FF",
      cosmosBlue: "#4BBEFF",
      cosmosViolet: "#7C5CFF",
      cosmosMagenta: "#A855F7",
      gridLine: "rgba(255,255,255,0.06)",
    },
  },

  royal_gold_cosmos: {
    id: "royal_gold_cosmos",
    backgroundFallback: "#07060B",
    overlay: {
      darkVeil: "rgba(4,4,10,0.52)",
      toneVeil: "rgba(39,20,61,0.18)",
      bottomDepth: "rgba(70,45,16,0.12)",
    },
    palette: {
      surface: "rgba(13,13,29,0.90)",
      surfaceRaised: "rgba(28,23,42,0.92)",
      border: "rgba(243,209,132,0.18)",
      borderStrong: "rgba(243,209,132,0.34)",
      royal: "#8B6CFF",
      royalGlow: "rgba(139,108,255,0.30)",
      gold: "#F3D184",
      goldGlow: "rgba(243,209,132,0.18)",
      textPrimary: "#FFF9EA",
      textSecondary: "#C8C0D1",
      textTertiary: "#8F8798",
      positive: "#3FCF8E",
      positiveSoft: "rgba(63,207,142,0.14)",
      neutral: "#F2B84B",
      neutralSoft: "rgba(242,184,75,0.14)",
      negative: "#F2617A",
      negativeSoft: "rgba(242,97,122,0.14)",
      warning: "#F2B84B",
      danger: "#F2617A",
      neutralAccent: "#65D4FF",
      cosmosBlue: "#65D4FF",
      cosmosViolet: "#8B6CFF",
      cosmosMagenta: "#C96DFF",
      gridLine: "rgba(255,249,234,0.07)",
    },
  },
});

export const DASHBOARD_THEME_IDS:
  readonly DashboardThemeId[] =
    Object.freeze([
      "royal_cosmos",
      "royal_gold_cosmos",
    ]);

export function isDashboardThemeId(
  value: unknown
): value is DashboardThemeId {
  return (
    typeof value === "string" &&
    DASHBOARD_THEME_IDS.includes(
      value as DashboardThemeId
    )
  );
}

export function resolveDashboardTheme(
  value: unknown
): DashboardThemeDefinition {
  return DASHBOARD_THEMES[
    isDashboardThemeId(value)
      ? value
      : DEFAULT_DASHBOARD_THEME_ID
  ];
}
