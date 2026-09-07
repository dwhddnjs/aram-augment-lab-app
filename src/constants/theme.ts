import "@/styles/global.css";

export const Theme = {
  dark: {
    surface: {
      base: "#0E0F12",
      raised: "#16181C",
      sunken: "#0A0B0D",
      overlay: "rgba(0,0,0,0.6)",
    },
    text: {
      primary: "#F2F4F7",
      secondary: "#B0B4BA",
      tertiary: "#7A7F87",
      disabled: "#4A4E55",
      inverse: "#0E0F12",
      onAccent: "#04231A",
    },
    border: {
      default: "#26292F",
      subtle: "#1B1E22",
      strong: "#3A3F47",
    },
    accent: {
      default: "#00E994",
      hover: "#2BEEA6",
      pressed: "#00C87E",
      subtle: "rgba(0,233,148,0.14)",
      onAccent: "#04231A",
    },
    status: {
      success: { default: "#1ED7A0", subtle: "rgba(30,215,160,0.14)" },
      warning: { default: "#F2B33D", subtle: "rgba(242,179,61,0.16)" },
      danger: { default: "#F26D6D", subtle: "rgba(242,109,109,0.16)" },
      info: { default: "#5BA8FF", subtle: "rgba(91,168,255,0.16)" },
    },
    // 유리 질감용 — 어두운 배경 위 칩/패널의 광택·림 라이트
    glass: {
      fill: "rgba(255,255,255,0.06)", // 베이스 반투명 채움
      sheen: "rgba(255,255,255,0.16)", // 상단 하이라이트 그라디언트 시작
      rimTop: "rgba(255,255,255,0.32)", // 상단 가장자리(빛 받는 면)
      rim: "rgba(255,255,255,0.10)", // 좌우/하단 가장자리
    },
  },
  light: {
    // iOS grouped 스타일 — 배경은 회색빛(systemGroupedBackground), 카드는 흰색.
    // 다크와 동일한 시맨틱: 밝기 raised(카드) > base(배경) > sunken.
    surface: {
      base: "#F2F2F7",
      raised: "#FFFFFF",
      sunken: "#E5E5EA",
      overlay: "rgba(15,17,21,0.45)",
    },
    text: {
      primary: "#0E0F12",
      secondary: "#5A6068",
      tertiary: "#878D96",
      disabled: "#B4B8BE",
      inverse: "#FAFBFC",
      onAccent: "#04231A",
    },
    border: {
      default: "#D7DAE0",
      subtle: "#E6E8EC",
      strong: "#B4B8BE",
    },
    // 라이트 accent — 흰/회색 배경 위 가독을 위해 다크(#00E994)보다 진한 민트.
    // #18A368 = 흰 배경 3.24:1(UI/큰 텍스트 AA). onAccent는 흰색보다 대비 높은 어두운 톤.
    accent: {
      default: "#18A368",
      hover: "#1DB775",
      pressed: "#148A57",
      subtle: "rgba(24,163,104,0.12)",
      onAccent: "#04231A",
    },
    status: {
      success: { default: "#0E9F79", subtle: "rgba(14,159,121,0.12)" },
      warning: { default: "#C98712", subtle: "rgba(201,135,18,0.16)" },
      danger: { default: "#D0463F", subtle: "rgba(208,70,63,0.16)" },
      info: { default: "#2E78D6", subtle: "rgba(46,120,214,0.16)" },
    },
    // 유리 질감용 — 밝은 배경에선 흰 광택을 더 강하게 주어 유리알 느낌
    glass: {
      fill: "rgba(255,255,255,0.45)",
      sheen: "rgba(255,255,255,0.65)",
      rimTop: "rgba(255,255,255,0.9)",
      rim: "rgba(255,255,255,0.35)",
    },
  },
} as const;

export type ThemeColors = typeof Theme.dark;

export const Typography = {
  display: { fontSize: 48, lineHeight: 52, fontWeight: "700" as const },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
  code: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
} as const;

export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

type ElevationLevel = {
  shadowColor?: string;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowRadius?: number;
};

export const Elevation: Record<
  "level0" | "level1" | "level2" | "level3",
  ElevationLevel
> = {
  level0: {},
  level1: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  level2: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  level3: {
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 18,
  },
};

// 증강 희귀도 고유색. 앱이 실제로 읽는 값은 border 하나다 — 테두리·아이콘 tint·
// 이름 색에 모두 이 한 색을 쓴다(gradient·glow·badge 는 쓰는 곳이 없어 걷어냈다).
//
// 다크(hero) 기준 팔레트. 밝은 배경 위에 그대로 올리면 대비가 무너지므로
// 라이트 모드용 짝을 따로 두고 useRarityColors() 가 골라준다.
export const AugmentRarityColors: Record<
  "silver" | "gold" | "prismatic",
  { border: string }
> = {
  silver: { border: "#9BA3AE" },
  gold: { border: "#E8B339" },
  prismatic: { border: "#E0D6FF" },
};

/**
 * 라이트 모드 짝 — 흰 배경(surface.raised) 대비 3.5:1.
 * 진하기를 두 번 낮춘 결과다(#5A6068 급 6.3~6.7:1 → 4.6:1 → 지금). 인게임 색에
 * 가까워진 대신 11pt 이름은 본문 텍스트 AA(4.5:1)를 밑돈다 — UI 요소 기준(3:1)만
 * 남는다. 색을 더 살리려면 값을 더 내리지 말고, 이름을 text.primary 로 돌리고
 * 티어 색은 보더·타일에만 남기는 쪽으로 갈 것.
 */
export const AugmentRarityColorsLight: typeof AugmentRarityColors = {
  silver: { border: "#828A93" },
  gold: { border: "#AD821F" },
  prismatic: { border: "#9877DA" },
};

/**
 * 챔피언 티어(S~D) 색 — 인게임 등급 위계를 그대로 빌린다.
 * S 프리즘 / A 골드 / B 실버 는 위 증강 희귀도 색을 재사용하고(같은 색이 같은 등급을
 * 뜻해야 한다), C 는 그 아래 "쇠", D 는 무채색 바닥이다.
 *
 * 쓰이는 곳은 티어 배너 그라데이션과 챔피언 타일 테두리 — 둘 다 UI 요소라 대비 기준이
 * 3:1 이다. 라이트 짝을 따로 두는 이유는 useRarityColors 주석과 같다(프리즘이 흰 배경에서 사라진다).
 */
export const TierColors: Record<
  "dark" | "light",
  Record<"S" | "A" | "B" | "C" | "D", string>
> = {
  dark: {
    S: AugmentRarityColors.prismatic.border,
    A: AugmentRarityColors.gold.border,
    B: AugmentRarityColors.silver.border,
    C: "#6D737C",
    D: "#4F545C",
  },
  light: {
    S: AugmentRarityColorsLight.prismatic.border,
    A: AugmentRarityColorsLight.gold.border,
    B: AugmentRarityColorsLight.silver.border,
    C: "#5C626A",
    D: "#43484F",
  },
};

// 증강 아이콘 미해결 시 표시하는 희귀도 폴백 글리프 (MaterialCommunityIcons).
// 여러 feature(aram·builds·items)가 공유하므로 여기 단일 정의를 import해 쓴다.
export const AugmentRarityGlyphs = {
  silver: "shield",
  gold: "star",
  prismatic: "shimmer",
} as const;

// splash 히어로 카드 내부 — 라이트/다크 공통 고정 어두운 톤(이미지 가독성).
// 카드 위는 컬러풀한 splash라 모드와 무관하게 어두운 scrim/타일이 표준이며,
// 이 그룹이 카드 내부 색의 유일한 출처다(다른 곳에서 hex 직접 쓰지 말 것).
export const HeroOverlay = {
  // 하단 scrim — 흰 텍스트 가독성용. 다크는 배경과 이어져 강하게 깔아도 되지만,
  // 라이트는 밝은 배경과 맞닿아 검은 띠처럼 튀므로 톤을 낮춘다.
  scrimDark: [
    "rgba(8,9,11,0)",
    "rgba(8,9,11,0.55)",
    "rgba(8,9,11,0.85)",
    "rgba(8,9,11,0.96)",
  ],
  scrimLight: [
    "rgba(8,9,11,0)",
    "rgba(8,9,11,0.3)",
    "rgba(8,9,11,0.55)",
    "rgba(8,9,11,0.7)",
  ],
  cardBase: "#0A0B0D", // splash 로드 전/빈 영역 베이스
  tileBg: "rgba(0,0,0,0.45)", // 증강·아이템 타일 배경
  tileBorder: "rgba(255,255,255,0.14)", // 아이템 타일 테두리
  chipBg: "rgba(0,0,0,0.55)", // 날짜 칩 배경
  textPrimary: "#F2F4F7",
  textSecondary: "#B5BAC1",
} as const;

/**
 * 아레나 골드(화폐) 색. 인게임 골드 톤이라 라이트/다크 공통으로 고정한다.
 * 등급 프레임의 gold highlight 와 값이 같지만 의미가 달라 별도로 둔다.
 */
export const ArenaGold = "#F2C766";

export const Brand = {
  splashBg: "#0E0F12",
  logoBgFrom: "#3C9FFE",
  logoBgTo: "#0274DF",
} as const;

export const Fonts = {
  sans: "system-ui",
  serif: "ui-serif",
  rounded: "ui-rounded",
  mono: "ui-monospace",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  double: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = 50;
