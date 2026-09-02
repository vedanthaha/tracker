export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  foreground: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  selection: string;
  focus: string;
}

export interface ThemeTypography {
  display: string;
  body: string;
  mono: string;
}

export interface ThemeShape {
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  borderWidth: number;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  shape: ThemeShape;
  density: "compact" | "comfortable" | "spacious";
}
